const http = require('http');

function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: body ? JSON.parse(body) : {} });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log('Checking API root...');
        const res = await makeRequest('/', 'GET');
        console.log('Root status:', res.status, res.data);

        console.log('Registering teacher...');
        const reg = await makeRequest('/auth/register', 'POST', {
            firstName: 'Simple',
            lastName: 'Teacher',
            email: `simplet${Date.now()}@test.com`,
            password: 'password123',
            role: 'TEACHER'
        });
        console.log('Reg status:', reg.status);
        console.log('Reg data:', reg.data);
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
