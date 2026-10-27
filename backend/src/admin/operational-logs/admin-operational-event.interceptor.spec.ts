import { ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of, throwError, toArray } from 'rxjs';
import { AdminOperationalEventInterceptor } from './admin-operational-event.interceptor.js';
import type { OperationalLogsService } from './operational-logs.service.js';

describe('Admin operational event recording', () => {
  const record = vi.fn();
  const request = { user: { sub: 7, role: 'ADMIN' }, params: { id: '42' },
    body: { password: 'secret', pin: '123456' }, headers: { authorization: 'secret' } };
  function execute(controller: string, handler: string, stream: any, req: any = request) {
    const context = { getClass: () => ({ name: controller }), getHandler: () => ({ name: handler }),
      switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
    return lastValueFrom(new AdminOperationalEventInterceptor({ record } as unknown as OperationalLogsService)
      .intercept(context, { handle: () => stream }).pipe(toArray()));
  }
  beforeEach(() => { vi.clearAllMocks(); record.mockResolvedValue({}); });

  it.each([
    ['UsersController', 'createUser'], ['UsersController', 'updateUser'],
    ['UsersController', 'toggleStatus'], ['UsersController', 'toggleArchive'],
    ['ClientsController', 'createClient'], ['ClientsController', 'updateClient'],
    ['ClientsController', 'toggleArchive'], ['ClientsController', 'addClientBooking'],
    ['ServicesController', 'createService'], ['ServicesController', 'updateService'],
    ['ServicesController', 'toggleStatus'], ['ServicesController', 'toggleArchive'],
    ['PromosController', 'savePromo'],
  ])('records one successful %s.%s event', async (controller, handler) => {
    const response = { id: 42, temporaryPassword: 'secret', temporaryPin: '123456' };
    expect(await execute(controller, handler, of(response))).toEqual([response]);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][0]).toMatchObject({ actorUserId: 7, userName: 'User #7', userRole: 'ADMIN', details: 'Record ID: 42' });
    expect(JSON.stringify(record.mock.calls)).not.toMatch(/secret|123456|password|authorization/i);
  });
  it.each([['UsersController', 'getUsers'], ['SuperadminController', 'createUser'],
    ['OperationalLogsController', 'archive'], ['ReportsController', 'submitCloseout'],
    ['UsersController', 'updateRole']])('does not add unrelated %s.%s events', async (controller, handler) => {
    await execute(controller, handler, of({ success: true }));
    expect(record).not.toHaveBeenCalled();
  });
  it('does not record rejected operations', async () => {
    await expect(execute('UsersController', 'createUser', throwError(() => new Error('Rejected')))).rejects.toThrow('Rejected');
    await execute('UsersController', 'createUser', of({success:false}, null));
    expect(record).not.toHaveBeenCalled();
  });
  it('does not record without authenticated actor identity', async () => {
    await execute('UsersController', 'createUser', of({id:42}), {});
    expect(record).not.toHaveBeenCalled();
  });
  it('attempts recording once per handler execution', async () => {
    await execute('UsersController', 'createUser', of({id:42}, {id:42}));
    expect(record).toHaveBeenCalledTimes(1);
  });
  it('preserves committed responses and emits a safe diagnostic on logging failure', async () => {
    const diagnostic=vi.spyOn(Logger.prototype,'error').mockImplementation(()=>{});
    record.mockRejectedValue(new Error('database-url-password'));
    const response={id:42};
    expect(await execute('UsersController','createUser',of(response))).toEqual([response]);
    expect(diagnostic).toHaveBeenCalledWith('Operational event recording failed');
    diagnostic.mockRestore();
  });
});
