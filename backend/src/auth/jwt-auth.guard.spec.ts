import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: vi.fn(),
  };
  const request = { headers: {} as Record<string, string>, user: undefined };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    request.headers = {};
    request.user = undefined;
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('attaches the verified member to the request', async () => {
    const user = { sub: 7, email: 'member@example.com', role: 'CUSTOMER' };
    request.headers.authorization = 'Bearer valid-token';
    jwtService.verifyAsync.mockResolvedValue(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('rejects expired or invalid tokens', async () => {
    request.headers.authorization = 'Bearer expired-token';
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});