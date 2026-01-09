const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://127.0.0.1:3000/api';

async function run() {
    try {
        console.log('--- Checking Fixes ---');

        // 1. Verify Register Response
        const email = `fix_test_${Date.now()}@test.com`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Fix Student',
            email,
            password: 'password123'
        });

        console.log('Register Response:', regRes.data);
        if (regRes.data.accessToken && regRes.data.role === 'student') {
            console.log('SUCCESS: Register returned token and user info');
        } else {
            console.log('FAILURE: Register response missing token or info');
        }

        const token = regRes.data.accessToken;

        // 2. Verify Courses List Progress
        // Create course
        const teacherEmail = `teacher_${Date.now()}@test.com`;
        await prisma.user.create({
            data: {
                name: 'Teacher',
                email: teacherEmail,
                password: 'hash',
                role: 'teacher',
                isApproved: true,
                courses: {
                    create: {
                        title: 'List Progress Test',
                        description: 'desc',
                        lessons: {
                            create: { title: 'L1', content: {} }
                        }
                    }
                }
            }
        });

        const teacherUser = await prisma.user.findUnique({ where: { email: teacherEmail }, include: { courses: { include: { lessons: true } } } });
        const courseId = teacherUser.courses[0].id;
        const lessonId = teacherUser.courses[0].lessons[0].id;

        // Complete lesson
        await prisma.lessonCompletion.create({
            data: { userId: regRes.data.id, lessonId }
        });

        // Fetch courses list
        const listRes = await axios.get(`${API_URL}/courses`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const myCourse = listRes.data.find(c => c.id === courseId);
        console.log('Course in List:', {
            id: myCourse.id,
            progress: myCourse.progress,
            completedLessons: myCourse.completedLessons
        });

        if (myCourse.progress === 100 && myCourse.completedLessons === 1) {
            console.log('SUCCESS: Progress calculated correctly in list endpoint');
        } else {
            console.log('FAILURE: Progress in list is incorrect');
        }

    } catch (e) {
        console.error(e.message);
        if (e.response) console.error(e.response.data);
    }
}

run();
