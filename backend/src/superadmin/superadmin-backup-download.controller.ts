import { Controller, Get, Param, Res, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import pg from 'pg';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperadminGuard } from './superadmin.guard.js';
import { ManagementActionPinGuard } from '../auth/management-action-pin.guard.js';

/** Downloads actual .dump objects, not manifests. Restricted to PIN-confirmed Superadmins. */
@Controller('api/superadmin/settings/backups')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class SuperadminBackupDownloadController {
  @Get(':id/download')
  @UseGuards(ManagementActionPinGuard)
  async download(@Param('id') id: string, @Res() response: Response) {
    if (!/^\d{1,20}$/.test(id)) throw new BadRequestException('Invalid backup job ID');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    let key: string | null = null;
    try {
      const result = await pool.query<{ storage_object_key: string | null }>(
        `SELECT storage_object_key FROM public.backup_jobs
         WHERE id = $1::bigint AND status = 'COMPLETED'`, [id],
      );
      key = result.rows[0]?.storage_object_key || null;
    } finally { await pool.end(); }
    if (!key) throw new NotFoundException('Verified stored backup not found');
    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    const endpoint = process.env.AWS_ENDPOINT_URL_S3;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!bucket || !region || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new BadRequestException('Object storage is not configured for backup downloads');
    }
    const client = new S3Client({
      region, endpoint, forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
    try {
      const output = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!output.Body) throw new NotFoundException('Backup storage object is empty');
      response.setHeader('Content-Type', 'application/octet-stream');
      response.setHeader('Content-Disposition', `attachment; filename="centyzz-backup-job-${id}.dump"`);
      response.setHeader('Cache-Control', 'private, no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      if (output.ContentLength != null) response.setHeader('Content-Length', String(output.ContentLength));
      await pipeline(output.Body as Readable, response);
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      throw error;
    } finally { client.destroy(); }
  }
}
