const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting...');
        const email = `debug${Date.now()}@test.com`;
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 8);

        console.log('Creating user...');
        const user = await prisma.user.create({
            data: {
                firstName: 'Debug',
                lastName: 'User',
                email: email,
                password: hashedPassword,
                role: 'STUDENT',
                isApproved: true
            }
        });
        console.log('User created:', user);
    } catch (e) {
        console.error('Error Code:', e.code);
        console.error('Error Message:', e.message);
        console.error('Error Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
