import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';
describe('AuthService', () => {
  let service: AuthService;
  let fakeUserService: Partial<UsersService>;
  beforeEach(async () => {
    const users: User[] = [];
    fakeUserService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
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
    await service.signup('bob@bob.com', '123bob');
    try {
      await service.signup('bob@bob.com', '123bob');
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
    await service.signup('sdadsa@dsadsa.com', '123123');
    try {
      await service.signin('sdadsa@dsadsa.com', 'bob');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
    }
  });
  it('returns a user if correct password is provided', async () => {
    await service.signup('asd@asd.com', 'mypass');
    const user = await service.signin('asd@asd.com', 'mypass');
    expect(user).toBeDefined();
  });
});
