import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
  const createDto = (password: string) => Object.assign(new RegisterDto(), {
    firstName: 'Taylor',
    lastName: 'Example',
    email: 'taylor@example.com',
    password,
  });

  it('accepts passwords with the required strength', async () => {
    const errors = await validate(createDto('StrongPass1!'));

    expect(errors).toHaveLength(0);
  });

  it.each([
    'Short1!',
    'lowercase1!',
    'UppercaseOnly!',
    'Uppercase1',
  ])('rejects a password that misses a strength requirement: %s', async (password) => {
    const errors = await validate(createDto(password));

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});