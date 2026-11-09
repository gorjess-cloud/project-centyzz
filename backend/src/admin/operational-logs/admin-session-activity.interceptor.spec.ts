import { ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { AdminSessionActivityInterceptor } from './admin-session-activity.interceptor.js';
import type { OperationalLogsService } from './operational-logs.service.js';
import { OperationalLogsController } from './operational-logs.controller.js';

describe('Admin/Staff session activity', () => {
  const recordSession = vi.fn();
  const service = { recordSession, list: vi.fn(), archive: vi.fn(), restore: vi.fn(), hide: vi.fn() };
  function run(handler: string, response: any, controller = 'AuthController') {
    const context = { getClass: () => ({ name: controller }), getHandler: () => ({ name: handler }) } as unknown as ExecutionContext;
    return lastValueFrom(new AdminSessionActivityInterceptor(service as unknown as OperationalLogsService)
      .intercept(context, { handle: () => of(response) }));
  }
  const session = (role = 'ADMIN', setup = false) => ({success:true, data:{accessToken:'test-token',user:{id:7,role,mustCompleteSetup:setup}}});
  beforeEach(() => { vi.clearAllMocks();recordSession.mockResolvedValue({recorded:true}); });
  it.each(['ADMIN','STAFF'])('records completed %s PIN sign-ins', async role => {
    const response=session(role);
    expect(await run('verifyManagementPin',response)).toBe(response);
    expect(recordSession).toHaveBeenCalledExactlyOnceWith(7,'Signed In','test-token');
  });
  it('records sign-in after first-time setup completes', async()=>{
    await run('completeManagementSetup',session());
    expect(recordSession).toHaveBeenCalledOnce();
  });
  it.each(['SUPERADMIN','CLIENT','CUSTOMER'])('excludes %s sessions', async role=>{
    await run('verifyManagementPin',session(role));expect(recordSession).not.toHaveBeenCalled();
  });
  it('does not record password-only login, incomplete setup, or action PIN checks',async()=>{
    await run('login',session());await run('verifyManagementPin',session('ADMIN',true));
    await run('checkActionPin',session());await run('verifyManagementPin',{success:false});
    expect(recordSession).not.toHaveBeenCalled();
  });
  it('does not inspect Superadmin business operations',async()=>{
    await run('verifyManagementPin',session(),'SuperadminController');expect(recordSession).not.toHaveBeenCalled();
  });
  it('preserves a valid login if event recording fails',async()=>{
    const logger=vi.spyOn(Logger.prototype,'error').mockImplementation(()=>{});
    recordSession.mockRejectedValue(new Error('sensitive connection error'));
    const response=session();expect(await run('verifyManagementPin',response)).toBe(response);
    expect(logger).toHaveBeenCalledWith('Admin/Staff sign-in recording failed');logger.mockRestore();
  });
  it('restricts Admin list and mutations at the backend',()=>{
    const controller=new OperationalLogsController(service as unknown as OperationalLogsService);
    const req={user:{sub:7,role:'ADMIN'}};
    controller.list(req);controller.archive(req,'42');controller.restore(req,'42');controller.hide(req,'42');
    expect(service.list).toHaveBeenCalledWith(false,true);
    expect(service.archive).toHaveBeenCalledWith('42',7,true);
    expect(service.restore).toHaveBeenCalledWith('42',true);
    expect(service.hide).toHaveBeenCalledWith('42',7,true);
  });
  it('preserves existing Superadmin log visibility',()=>{
    new OperationalLogsController(service as unknown as OperationalLogsService).list({user:{sub:1,role:'SUPERADMIN'}});
    expect(service.list).toHaveBeenCalledWith(false,false);
  });
  it('allows Staff to record sign-out but denies access to log lists',async()=>{
    const controller=new OperationalLogsController(service as unknown as OperationalLogsService);
    const req={user:{sub:7,role:'STAFF'},headers:{authorization:'Bearer test-token'}};
    await expect(controller.signOut(req)).resolves.toEqual({success:true,recorded:true});
    expect(recordSession).toHaveBeenCalledWith(7,'Signed Out','test-token');
    expect(()=>controller.list(req)).toThrow('Manager access required');
    await expect(controller.signOut({...req,user:{sub:1,role:'SUPERADMIN'}})).rejects.toThrow('Admin or Staff session required');
  });
});
