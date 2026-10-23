import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../prisma/db.js';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  // Development-only concurrency protection; use a durable job queue in production.
  private isRunning = false;

  async createBackup(actorUserId: number) {
    if (this.isRunning) {
      throw new ConflictException('A database backup is already running on this server');
    }
    this.isRunning = true;
    let jobId: string | undefined;
    let temporaryDirectory: string | undefined;

    try {
      const connectionString = this.requireEnvironmentVariable('DATABASE_URL_UNPOOLED');
      const dumpPath = this.requireEnvironmentVariable('PG_DUMP_PATH');
      const restorePath = this.requireEnvironmentVariable('PG_RESTORE_PATH');
      const bucket = this.requireEnvironmentVariable('S3_BUCKET');
      const region = this.requireEnvironmentVariable('AWS_REGION');
      const endpoint = this.requireEnvironmentVariable('AWS_ENDPOINT_URL_S3');
      const accessKeyId = this.requireEnvironmentVariable('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.requireEnvironmentVariable('AWS_SECRET_ACCESS_KEY');

      const connection = new URL(connectionString);
      if (!['postgres:', 'postgresql:'].includes(connection.protocol)) {
        throw new Error('DATABASE_URL_UNPOOLED must be a PostgreSQL URL');
      }
      if (connection.hostname.includes('-pooler')) {
        throw new Error('DATABASE_URL_UNPOOLED must use a direct Neon host, not the pooler');
      }

      // Password is passed via environment, never as a CLI argument.
      const postgresEnvironment: NodeJS.ProcessEnv = {
        ...process.env,
        PGHOST: connection.hostname,
        PGPORT: connection.port || '5432',
        PGUSER: decodeURIComponent(connection.username),
        PGPASSWORD: decodeURIComponent(connection.password),
        PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
        PGSSLMODE: 'require',
        PGCONNECT_TIMEOUT: '20',
      };

      const createPlan = db.raw.sql`
        INSERT INTO public.backup_jobs (requested_by, status)
        VALUES (${actorUserId}, 'PENDING')
        RETURNING id::text AS id
      `.returnsRow({ id: 'pg/text@1' }).build();
      const [job] = await db.runtime().query(createPlan);
      if (!job) throw new Error('Failed to create backup job');
      jobId = job.id;

      const runningPlan = db.raw.sql`
        UPDATE public.backup_jobs
        SET status = 'RUNNING', started_at = NOW()
        WHERE id = ${jobId}::bigint AND status = 'PENDING'
      `.affectedCount().build();
      await db.runtime().execute(runningPlan);

      temporaryDirectory = await mkdtemp(join(tmpdir(), 'centyzz-backup-'));
      const localFile = join(temporaryDirectory, 'centyzz.dump');

      await this.runTool(dumpPath, ['--format=custom', '--no-password', `--file=${localFile}`], postgresEnvironment);
      const file = await stat(localFile);
      if (file.size <= 0) throw new Error('pg_dump produced an empty archive');

      // Check that pg_restore can at least read the archive table of contents.
      await this.runTool(restorePath, ['--list', localFile], process.env);

      const s3 = new S3Client({
        region,
        endpoint,
        forcePathStyle: true, // Required by Neon Object Storage.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        credentials: { accessKeyId, secretAccessKey },
      });
      const objectKey = `database-backups/centyzz-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.dump`;

      try {
        const uploader = new Upload({
          client: s3,
          params: {
            Bucket: bucket,
            Key: objectKey,
            Body: createReadStream(localFile),
            ContentType: 'application/octet-stream',
          },
          partSize: 8 * 1024 * 1024,
          queueSize: 2,
          leavePartsOnError: false,
        });
        await uploader.done();
        const uploaded = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
        if (uploaded.ContentLength !== file.size) {
          throw new Error('Uploaded backup size does not match local file size');
        }
      } finally {
        s3.destroy();
      }

      const completePlan = db.raw.sql`
        UPDATE public.backup_jobs
        SET status = 'COMPLETED',
            storage_object_key = ${objectKey},
            file_size_bytes = ${String(file.size)}::bigint,
            completed_at = NOW(),
            error_message = NULL
        WHERE id = ${jobId}::bigint AND status = 'RUNNING'
      `.affectedCount().build();
      const result = await db.runtime().execute(completePlan);
      if (result.affectedRows !== 1) throw new Error('Unable to finalize backup job');

      return {
        success: true,
        message: 'Database backup uploaded and verified successfully',
        data: {
          jobId,
          status: 'COMPLETED',
          fileSizeBytes: String(file.size),
          storageObjectKey: objectKey,
        },
      };
    } catch (error) {
      // Avoid logging pg_dump stderr, database URLs, or credentials.
      this.logger.error(`Database backup failed (${error instanceof Error ? error.name : 'UnknownError'})`);
      if (jobId) {
        try {
          const failureMessage = 'Backup generation, validation, upload, or finalization failed';
          const failedPlan = db.raw.sql`
            UPDATE public.backup_jobs
            SET status = 'FAILED', error_message = ${failureMessage}, completed_at = NOW()
            WHERE id = ${jobId}::bigint AND status <> 'COMPLETED'
          `.affectedCount().build();
          await db.runtime().execute(failedPlan);
        } catch {
          this.logger.error('Unable to mark backup job FAILED');
        }
      }
      throw new InternalServerErrorException('Database backup failed; review backend logs and backup job history');
    } finally {
      if (temporaryDirectory) {
        await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {
          this.logger.warn('Could not remove temporary backup directory');
        });
      }
      this.isRunning = false;
    }
  }

  private requireEnvironmentVariable(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
  }

  private runTool(executable: string, args: string[], environment: NodeJS.ProcessEnv): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        env: environment,
        windowsHide: true,
        shell: false,
        stdio: 'ignore',
      });
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, 10 * 60 * 1000);

      child.once('error', () => {
        clearTimeout(timer);
        reject(new Error('Backup tool could not start'));
      });
      child.once('close', (code) => {
        clearTimeout(timer);
        if (code === 0 && !timedOut) resolve();
        else reject(new Error(timedOut ? 'Backup tool timed out' : 'Backup tool failed'));
      });
    });
  }
}
