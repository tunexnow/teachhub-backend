const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api';

async function runVerification() {
    try {
        console.log('--- Starting Verification ---');

        // Wait for server to be ready
        console.log('Waiting for server...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Create/Login Teacher 1
        console.log('\n--- 1. Authenticating Teacher 1 ---');
        let token1;
        let userId1;
        try {
            const res = await axios.post(`${API_URL}/auth/register`, {
                name: 'Teacher One',
                email: 't1@example.com',
                password: 'password123',
                role: 'teacher'
            });
            token1 = res.data.token;
            userId1 = res.data.user.id;
        } catch (e) {
            if (e.response.status === 400) {
                const res = await axios.post(`${API_URL}/auth/login`, {
                    email: 't1@example.com',
                    password: 'password123'
                });
                token1 = res.data.token;
                userId1 = res.data.user.id;
            } else throw e;
        }
        console.log('Teacher 1 authenticated');

        // 2. Create/Login Teacher 2
        console.log('\n--- 2. Authenticating Teacher 2 ---');
        let token2;
        try {
            const res = await axios.post(`${API_URL}/auth/register`, {
                name: 'Teacher Two',
                email: 't2@example.com',
                password: 'password123',
                role: 'teacher'
            });
            token2 = res.data.token;
        } catch (e) {
            if (e.response.status === 400) {
                const res = await axios.post(`${API_URL}/auth/login`, {
                    email: 't2@example.com',
                    password: 'password123'
                });
                token2 = res.data.token;
            } else throw e;
        }
        console.log('Teacher 2 authenticated');

        // 3. Teacher 1 Creates Course
        console.log('\n--- 3. Teacher 1 creating course ---');
        const courseRes = await axios.post(`${API_URL}/courses`, {
            title: 'T1 Course',
            description: 'Course by Teacher 1',
            thumbnail: 'img.jpg',
            duration: 60
        }, { headers: { Authorization: `Bearer ${token1}` } });
        const courseId = courseRes.data.id;
        console.log('Course created:', courseId);

        // 4. Teacher 2 Tries to Update (Should Fail)
        console.log('\n--- 4. Teacher 2 attempting to update course (Expected 403) ---');
        try {
            await axios.put(`${API_URL}/courses/${courseId}`, {
                title: 'Hacked Title'
            }, { headers: { Authorization: `Bearer ${token2}` } });
            console.error('ERROR: Teacher 2 was able to update the course!');
        } catch (e) {
            if (e.response.status === 403) {
                console.log('Success: Teacher 2 blocked (403 Forbidden)');
            } else {
                console.error('Unexpected error:', e.response.status, e.response.data);
            }
        }

        // 5. Teacher 1 Updates Course (Should Succeed)
        console.log('\n--- 5. Teacher 1 updating course ---');
        const updateRes = await axios.put(`${API_URL}/courses/${courseId}`, {
            title: 'Updated Title',
            description: 'Updated Description',
            thumbnail: 'img.jpg',
            duration: 120
        }, { headers: { Authorization: `Bearer ${token1}` } });
        console.log('Update success, new title:', updateRes.data.title);

        // 6. Teacher 1 Adds Game Lesson
        console.log('\n--- 6. Adding Game Lesson ---');
        const lessonRes = await axios.post(`${API_URL}/lessons`, {
            title: 'Game Lesson',
            type: 'game',
            courseId: courseId,
            content: { gameEmbedUrl: 'http://game.com', body: 'Play this' }
        }, { headers: { Authorization: `Bearer ${token1}` } });
        const lessonId = lessonRes.data.id;
        console.log('Game lesson created:', lessonId, 'Type:', lessonRes.data.type);

        // 7. Check isCompleted (Should be false)
        console.log('\n--- 7. Checking initial isCompleted status ---');
        const getLessonRes1 = await axios.get(`${API_URL}/lessons/${lessonId}`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('isCompleted (expect false):', getLessonRes1.data.isCompleted);

        // 8. Mark Complete
        console.log('\n--- 8. Marking lesson as complete ---');
        await axios.post(`${API_URL}/lessons/${lessonId}/complete`, {}, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('Lesson marked complete');

        // 9. Check isCompleted (Should be true)
        console.log('\n--- 9. Checking isCompleted status after completion ---');
        const getLessonRes2 = await axios.get(`${API_URL}/lessons/${lessonId}`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('isCompleted (expect true):', getLessonRes2.data.isCompleted);

        // 10. Check Course structure for isCompleted
        console.log('\n--- 10. Checking Course details for lesson isCompleted ---');
        const getCourseRes = await axios.get(`${API_URL}/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        const lessonInCourse = getCourseRes.data.lessons.find(l => l.id === lessonId);
        console.log('Lesson in course isCompleted (expect true):', lessonInCourse.isCompleted);

        console.log('\n--- VERIFICATION COMPLETE ---');

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error details:', error);
        }
    }
}

runVerification();
