const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://127.0.0.1:3000/api';

async function run() {
    try {
        console.log('--- Checking Progress Field ---');

        // 1. Create Approved Teacher directly in DB
        const email = `progress_test_${Date.now()}@test.com`;
        const password = 'password123';
        // We need a hashed password, or just login with expectation (but login compares hash)
        // Actually, let's just create the user and then mocking the login is hard without bcrypt.
        // It's easier to create user via Prisma with a KNOWN hash or just use the register API and then UPDATE to teacher/approved.

        // Let's use API to register (as student), then Prisma to upgrade to Approved Teacher.
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Progress Teacher',
            email,
            password,
            role: 'teacher' // Will be ignored
        });
        const userId = regRes.data.userId;

        // Upgrade to Teacher & Approve
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'teacher', isApproved: true }
        });

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.accessToken;

        // 2. Create Course & Lesson
        const courseRes = await axios.post(`${API_URL}/courses`, {
            title: 'Progress Test', description: 'desc', thumbnail: 't', duration: 10
        }, { headers: { Authorization: `Bearer ${token}` } });
        const courseId = courseRes.data.id;

        const lessonRes = await axios.post(`${API_URL}/lessons`, {
            title: 'L1', type: 'text', courseId, content: { body: 'text' }
        }, { headers: { Authorization: `Bearer ${token}` } });
        const lessonId = lessonRes.data.id;

        // 3. Check Initial Progress (Should be 0)
        let getRes = await axios.get(`${API_URL}/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Initial Progress:', getRes.data.progress);

        // 4. Complete Lesson
        await axios.post(`${API_URL}/lessons/${lessonId}/complete`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 5. Check Progress (Should be 100)
        getRes = await axios.get(`${API_URL}/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Final Progress:', getRes.data.progress);

        if (getRes.data.progress === 100) {
            console.log('SUCCESS: Progress updated to 100%');
        } else {
            console.log('FAILURE: Progress is ' + getRes.data.progress);
        }

    } catch (e) {
        console.error(e.message);
        if (e.response) console.error(e.response.data);
    }
}

run();
