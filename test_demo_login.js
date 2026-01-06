const axios = require('axios');

const API_URL = 'https://teachhub-api.onrender.com/api'; // Production
// const API_URL = 'http://127.0.0.1:3000/api'; // Local

async function testLogin() {
    try {
        console.log('Testing Demo Login...');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'demo_teacher@teachhub.com',
            password: 'Password123!'
        });
        console.log('✅ Login Successful!');
        console.log('User:', res.data.name);
        console.log('Role:', res.data.role);
        console.log('Token:', res.data.accessToken ? 'Present' : 'Missing');
    } catch (error) {
        console.error('❌ Login Failed:', error.response?.data || error.message);
    }
}

testLogin();
