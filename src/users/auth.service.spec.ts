import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';
describe('AuthService', () => {
  let service: AuthService;
  let fakeUserService: Partial<UsersService>;
  beforeEach(async () => {
    // Fake copy of user service
    fakeUserService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password }),
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });
  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });
  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('bob@bob.com', 'asdf');
    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });
  it('throws an error if the email is in use', async () => {
    fakeUserService.find = () =>
      Promise.resolve([
        { id: 1, email: 'bob@bob.com', password: 'asdf' } as User,
      ]);
    try {
      await service.signup('bob@bob.com', 'asdf');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toContain('Email bob@bob.com is already in use');
    }
  });
  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signin('something@something.com', 'asdf');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
    }
  });
  it('throws an error if an invalid password is provided', async () => {
    fakeUserService.find = () =>
      Promise.resolve([{ email: 'bob@bob.com', password: 'asdf' } as User]);
    try {
      await service.signin('sdadsa@dsadsa.com', '123123');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
    }
  });
});
