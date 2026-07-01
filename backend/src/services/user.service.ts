import { hashPassword } from './auth.service.js';
import * as userRepository from '../repositories/user.repository.js';
import type { CreateUserDto, UpdateUserDto } from '../dtos/user.dto.js';

export const getUsers = () => userRepository.listUsers();

export const getUser = (id: string) => userRepository.findUserById(id);

export const createUser = async (data: CreateUserDto) => {
  const hashedPassword = await hashPassword(data.password);
  return userRepository.createUser({ ...data, password: hashedPassword });
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const updateData = { ...data };
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }
  return userRepository.updateUser(id, updateData);
};

export const removeUser = (id: string) => userRepository.deleteUser(id);
