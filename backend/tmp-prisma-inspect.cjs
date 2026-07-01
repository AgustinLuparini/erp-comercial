const p = require('@prisma/client');
console.log(Object.keys(p));
console.log(typeof p.PrismaClient, typeof p.default);
