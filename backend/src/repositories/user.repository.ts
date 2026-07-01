import { prisma } from '../prisma/client.js';
import type { CreateUserDto, UpdateUserDto } from '../dtos/user.dto.js';

export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });

export const listUsers = () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

export const createUser = (data: CreateUserDto) => prisma.user.create({ data });

export const updateUser = (id: string, data: UpdateUserDto) => prisma.user.update({ where: { id }, data });

export const deleteUser = (id: string) => prisma.user.delete({ where: { id } });
