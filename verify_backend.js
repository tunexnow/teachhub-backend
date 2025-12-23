const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let teacherToken = '';
let courseId = '';

const runVerification = async () => {
    console.log('--- Starting Backend Verification ---');

    // 1. Register Teacher
    try {
        console.log('\n1. Registering Teacher...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Teacher',
            email: `teacher_${Date.now()}@test.com`, // Unique email
            password: 'password123',
            role: 'teacher'
        });
        console.log('✅ Registered:', regRes.data);
    } catch (error) {
        console.error('❌ Registration Failed:', error.response?.data || error.message);
        return;
    }

    // 2. Login
    try {
        console.log('\n2. Logging in...');
        // Note: We need to use the email we just generated.
        // Ideally we'd store it, but for simplicity let's just re-register or use return val if possible.
        // Ah, I didn't save the email. Let's fix that structure.
    } catch (error) { }
};

// Better structure with state
async function main() {
    const email = `teacher_${Date.now()}@test.com`;
    const password = 'password123';

    try {
        console.log(`\n--- 1. Registering Teacher (${email}) ---`);
        await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Teacher',
            email,
            password,
            role: 'teacher'
        });
        console.log('✅ Success');

        console.log('\n--- 2. Logging In ---');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        teacherToken = loginRes.data.accessToken;
        console.log('✅ Success. Token received.');

        console.log('\n--- 3. Creating Course ---');
        const courseRes = await axios.post(`${API_URL}/courses`, {
            title: 'Intro to Prisma',
            description: 'Learn how to use Prisma with TiDB',
            thumbnail: 'http://example.com/image.png'
        }, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        courseId = courseRes.data.id;
        console.log(`✅ Success. Course ID: ${courseId}`);

        console.log('\n--- 4. Adding Lesson ---');
        const lessonRes = await axios.post(`${API_URL}/lessons`, {
            title: 'Lesson 1: Setup',
            subtitle: 'Getting started',
            type: 'video',
            courseId: courseId,
            content: {
                videoUrl: 'https://youtube.com/watch?v=123',
                gameEmbedUrl: 'https://wordwall.net/embed/123',
                flashcards: [{ q: 'What is Prisma?', a: 'ORM' }],
                quiz: [{ q: 'Is it cool?', a: 'Yes' }]
            }
        }, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        const lessonId = lessonRes.data.id;
        console.log(`✅ Success. Lesson ID: ${lessonId}`);

        console.log('\n--- 5. Fetching Lesson Details ---');
        const getLessonRes = await axios.get(`${API_URL}/lessons/${lessonId}`);
        console.log('✅ Success. Lesson Data:', getLessonRes.data);

        console.log('\n🎉 ALL VERIFICATION STEPS PASSED!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
    }
}

main();
