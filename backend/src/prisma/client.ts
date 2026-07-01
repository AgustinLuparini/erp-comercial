import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../node_modules/.prisma/client/index.js');

export const prisma = new PrismaClient();
