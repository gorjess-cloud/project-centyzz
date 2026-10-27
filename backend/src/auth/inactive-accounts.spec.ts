import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UsersService } from '../admin/users/users.service.js';
import { db } from '../prisma/db.js';

vi.mock('../prisma/db.js',()=>({db:{orm:{public:{User:{where:vi.fn()}}}}}));

describe('Deactivated accounts',()=>{
  let account: any;
  const jwt={signAsync:vi.fn(),verifyAsync:vi.fn()};
  const security={requireConfigured:vi.fn(),verifyPin:vi.fn()};
  let auth: AuthService;
  beforeEach(()=>{
    vi.clearAllMocks();vi.stubEnv('GOOGLE_CLIENT_ID','test-client');
    account={id:7,email:'staff@example.invalid',role:'STAFF',isActive:true,emailVerified:true};
    vi.mocked(db.orm.public.User.where).mockImplementation(()=>({
      first:async()=>({...account}),update:async(change:any)=>{Object.assign(account,change);return {...account};},
    }) as any);
    auth=new AuthService(jwt as any,{} as any,security as any);
  });
  afterEach(()=>vi.unstubAllEnvs());
  it('Deactivate Account persists isActive=false; Activate Account restores true',async()=>{
    const users=new UsersService(security as any);
    expect(await users.toggleUserStatus(7,9)).toMatchObject({id:7,isActive:false});
    expect(account.isActive).toBe(false);
    await expect(auth.login({email:account.email,password:'unused'})).rejects.toThrow('Account is inactive');
    expect(jwt.signAsync).not.toHaveBeenCalled();
    expect(await users.toggleUserStatus(7,9)).toMatchObject({id:7,isActive:true});
  });
  it.each(['ADMIN','STAFF','CUSTOMER'])('blocks password login for inactive %s',async role=>{
    account.role=role;account.isActive=false;
    await expect(auth.login({email:account.email,password:'unused'})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
  it.each(['ADMIN','STAFF','CUSTOMER'])('blocks Google login for inactive %s',async role=>{
    account.role=role;account.isActive=false;
    vi.spyOn((auth as any).googleClient,'verifyIdToken').mockResolvedValue({getPayload:()=>({sub:'google-test',email:account.email,email_verified:true})});
    await expect(auth.googleLogin('disposable-google-token')).rejects.toThrow('Account is inactive');
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
  it('blocks PIN verification if the account was deactivated after the password step',async()=>{
    account.isActive=false;
    jwt.verifyAsync.mockResolvedValue({sub:7,email:account.email,role:account.role,purpose:'pin'});
    await expect(auth.verifyManagementPin('previous-pin-challenge','938274')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(security.verifyPin).not.toHaveBeenCalled();expect(jwt.signAsync).not.toHaveBeenCalled();
  });
  it('blocks an existing access token on the next protected request',async()=>{
    account.isActive=false;
    jwt.verifyAsync.mockResolvedValue({sub:7,email:account.email,role:account.role,purpose:'access'});
    const req={headers:{authorization:'Bearer previously-issued-token'},user:undefined};
    const context={switchToHttp:()=>({getRequest:()=>req})} as unknown as ExecutionContext;
    await expect(new JwtAuthGuard(jwt as any,security as any).canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(req.user).toBeUndefined();
  });
});
