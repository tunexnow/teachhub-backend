const { PrismaClient, UserRole } = require('@prisma/client');
console.log('UserRole:', UserRole);
const prisma = new PrismaClient();
console.log('User model:', prisma.user);
