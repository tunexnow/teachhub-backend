const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api';
let adminToken = '';
let teacherId = '';

async function main() {
    const studentEmail = `student_${Date.now()}@test.com`;
    const teacherEmail = `teacher_${Date.now()}@test.com`;
    const adminEmail = `admin_root@test.com`; // Assuming this admin exists or we register one
    const password = 'password123';

    try {
        console.log('--- 1. Register Student (Auto-Approve) ---');
        const stReg = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Student',
            email: studentEmail,
            password
        });
        console.log('✅ Student Registered:', stReg.data);

        console.log('\n--- 2. Student Login (Should Succeed) ---');
        await axios.post(`${API_URL}/auth/login`, { email: studentEmail, password });
        console.log('✅ Student Login Success');

        console.log('\n--- 3. Register Teacher (Pending) ---');
        const teachReg = await axios.post(`${API_URL}/auth/register/teacher`, {
            name: 'Test Teacher', // Fixed missing name
            email: teacherEmail,
            password
        });
        console.log('✅ Teacher Registered:', teachReg.data);
        teacherId = teachReg.data.userId;

        console.log('\n--- 4. Teacher Login (Should Fail) ---');
        try {
            await axios.post(`${API_URL}/auth/login`, { email: teacherEmail, password });
            console.error('❌ Teacher Login SHOULD have failed but succeeded.');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✅ Teacher Login Failed as expected (403 Forbidden).');
            } else {
                console.error('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n--- 5. Admin Login & Approval ---');
        // Registering an admin first to ensure we have one (if not exists)
        console.log('⚠️ Skipping Admin Approval verification step (requires seeded admin).');
        console.log('To manually verify: Update DB to set role="admin" for a user, then hit /api/admin/teachers/:id/approve');

    } catch (error) {
        console.error('❌ Verification Failed!');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
