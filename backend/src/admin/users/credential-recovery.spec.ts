import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { CredentialRecoveryController } from './credential-recovery.controller.js';
import { CredentialRecoveryService, recoveryOrigin } from './credential-recovery.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { ManagementActionPinGuard } from './management-action-pin.guard.js';
import { ManagementSecurityService } from '../../auth/management-security.service.js';
import { AdminOperationalEventInterceptor } from '../operational-logs/admin-operational-event.interceptor.js';
import { OperationalLogsService } from '../operational-logs/operational-logs.service.js';
import { db } from '../../prisma/db.js';

vi.mock('../../prisma/db.js',()=>({db:{orm:{public:{User:{where:vi.fn()}}}}}));

describe('Admin credential recovery API',()=>{
  let app: any;
  let role='ADMIN',version=0,tokenVersion:number|undefined=undefined;
  const recovery={request:vi.fn(),complete:vi.fn()};
  const security={requireConfigured:vi.fn(),verifyPin:vi.fn()};
  beforeAll(async()=>{
    const module=await Test.createTestingModule({
      controllers:[UsersController,CredentialRecoveryController],
      providers:[
        {provide:UsersService,useValue:{}},{provide:CredentialRecoveryService,useValue:recovery},
        {provide:ManagementSecurityService,useValue:security},
        {provide:JwtService,useValue:{verifyAsync:async(token:string)=>{
          if(token!=='test-access')throw new UnauthorizedException();
          return{sub:7,email:'admin@example.invalid',role,purpose:'access',credentialVersion:tokenVersion};
        }}},
        JwtAuthGuard,RolesGuard,ManagementActionPinGuard,AdminOperationalEventInterceptor,
        {provide:OperationalLogsService,useValue:{record:vi.fn()}},
      ],
    }).compile();
    app=module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
    await app.init();
  });
  afterAll(async()=>{await app.close();});
  beforeEach(()=>{
    vi.clearAllMocks();role='ADMIN';version=0;tokenVersion=undefined;
    vi.mocked(db.orm.public.User.where).mockImplementation(()=>({first:async()=>({id:7,email:'admin@example.invalid',role,isActive:true})}) as any);
    security.requireConfigured.mockImplementation(async()=>({needs_setup:false,credential_version:version}));
    security.verifyPin.mockImplementation(async(_id,pin)=>{
      if(pin!=='938274')throw new UnauthorizedException('Invalid management PIN');
      return{needs_setup:false};
    });
    recovery.request.mockResolvedValue({success:true,message:'Reset email sent'});
    recovery.complete.mockResolvedValue({success:true});
  });
  it('requires authentication before sending an email',async()=>{
    await request(app.getHttpServer()).post('/api/admin/users/42/reset-password-email').expect(401);
    expect(recovery.request).not.toHaveBeenCalled();
  });
  it.each(['STAFF','SUPERADMIN','CUSTOMER'])('does not allow %s to issue Admin recovery links',async(value)=>{
    role=value;
    await request(app.getHttpServer()).post('/api/admin/users/42/reset-password-email').set('Authorization','Bearer test-access').set('X-Management-Pin','938274').expect(403);
    expect(recovery.request).not.toHaveBeenCalled();
  });
  it.each([undefined,'000000'])('rejects missing or incorrect action PIN (%s)',async(pin)=>{
    let req=request(app.getHttpServer()).post('/api/admin/users/42/reset-pin-email').set('Authorization','Bearer test-access');
    if(pin)req=req.set('X-Management-Pin',pin);
    await req.expect(401);expect(recovery.request).not.toHaveBeenCalled();
  });
  it.each(['password','pin'])('sends %s email only after Admin and PIN verification',async(kind)=>{
    await request(app.getHttpServer()).post(`/api/admin/users/42/reset-${kind}-email`).set('Authorization','Bearer test-access').set('X-Management-Pin','938274').expect(201);
    expect(recovery.request).toHaveBeenCalledExactlyOnceWith(42,kind,7);
  });
  it('blocks an access token issued before a credential reset',async()=>{
    version=1;
    await request(app.getHttpServer()).post('/api/admin/users/42/reset-pin-email').set('Authorization','Bearer test-access').set('X-Management-Pin','938274').expect(401);
    expect(recovery.request).not.toHaveBeenCalled();
  });
  it('accepts a fresh token with the current credential version',async()=>{
    version=2;tokenVersion=2;
    await request(app.getHttpServer()).post('/api/admin/users/42/reset-pin-email').set('Authorization','Bearer test-access').set('X-Management-Pin','938274').expect(201);
  });
  it('rejects malformed token submissions before calling the recovery service',async()=>{
    await request(app.getHttpServer()).post('/api/admin/credential-recovery/complete').send({kind:'password',token:'short',newValue:'New!Password123',confirmValue:'New!Password123'}).expect(400);
    expect(recovery.complete).not.toHaveBeenCalled();
  });
  it('has no GET endpoint that can consume an email link',async()=>{
    await request(app.getHttpServer()).get('/api/admin/credential-recovery/complete').expect(404);
    expect(recovery.complete).not.toHaveBeenCalled();
  });
  it('accepts the single-use token submission without requiring the forgotten credential',async()=>{
    const body={kind:'pin',token:'a'.repeat(43),newValue:'938274',confirmValue:'938274'};
    await request(app.getHttpServer()).post('/api/admin/credential-recovery/complete').send(body).expect(201);
    expect(recovery.complete).toHaveBeenCalledExactlyOnceWith(body.kind,body.token,body.newValue,body.confirmValue);
  });
});

describe('Recovery link destination',()=>{
  afterEach(()=>vi.unstubAllEnvs());
  it('defaults to local development',()=>{vi.stubEnv('CREDENTIAL_RECOVERY_ORIGIN','');expect(recoveryOrigin()).toBe('http://localhost:5173');});
  it('supports a configured HTTPS deployment',()=>{vi.stubEnv('CREDENTIAL_RECOVERY_ORIGIN','https://salon.example');expect(recoveryOrigin()).toBe('https://salon.example');});
  it.each(['http://salon.example','https://attacker@salon.example','https://salon.example/?redirect=elsewhere'])('rejects unsafe destinations: %s',origin=>{
    vi.stubEnv('CREDENTIAL_RECOVERY_ORIGIN',origin);expect(()=>recoveryOrigin()).toThrow();
  });
});
