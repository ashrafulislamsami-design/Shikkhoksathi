// backend/scripts/testSecurity.js
const http = require('http');

const makeRequest = (path, method, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(payload);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING SHIKKHOKSATHI SECURITY OVERHAUL AUDIT ---');

  try {
    // 1. Verify health check or basic get endpoint
    console.log('\nTesting root / endpoint...');
    const health = await makeRequest('/', 'GET');
    console.log(`Status: ${health.statusCode}, Response:`, health.data);

    // 2. Test NoSQL Injection protection
    console.log('\nTesting NoSQL injection prevention...');
    const maliciousPayload = {
      email: { '$ne': null },
      password: 'password123'
    };
    const nosqlRes = await makeRequest('/api/student/login', 'POST', {}, maliciousPayload);
    console.log(`Status: ${nosqlRes.statusCode} (Expected: 400)`);
    console.log('Response:', nosqlRes.data);
    if (nosqlRes.statusCode === 400 && nosqlRes.data.message === 'Malicious or invalid input detected') {
      console.log('✅ NoSQL injection blocked successfully!');
    } else {
      console.error('❌ NoSQL injection test failed!');
    }

    // 3. Test XSS / HTML Script tag neutralization
    console.log('\nTesting XSS / Script tag neutralization...');
    const xssPayload = {
      name: '<script>alert("XSS")</script>',
      email: `test_xss_${Date.now()}@example.com`,
      password: 'password123',
      role: 'student',
      studentClass: '10'
    };
    const xssRes = await makeRequest('/api/student/register', 'POST', {}, xssPayload);
    console.log(`Status: ${xssRes.statusCode} (Expected: 400 if blocked, or register failure due to missing fields/OTP)`);
    console.log('Response:', xssRes.data);
    if (xssRes.statusCode === 400 && xssRes.data.message === 'Malicious or invalid input detected') {
      console.log('✅ XSS input blocked successfully!');
    } else {
      console.log('Input was processed by Express.');
    }

    // 4. Test Rate Limiting on Auth Endpoint (Max 5 requests in 15 mins)
    console.log('\nTesting aggressive rate limiter on /api/student/login...');
    let blocked = false;
    for (let i = 0; i < 8; i++) {
      const res = await makeRequest('/api/student/login', 'POST', {}, { email: 'rate@example.com', password: 'wrongpassword' });
      console.log(`Request #${i+1} status: ${res.statusCode}`);
      if (res.statusCode === 429) {
        blocked = true;
        console.log('✅ Rate limiter triggered! IP blocked successfully.');
        break;
      }
    }
    if (!blocked) {
      console.warn('⚠️ Rate limiter was not triggered (perhaps server rate limiting configuration is not active).');
    }

    console.log('\n--- SECURITY AUDIT COMPLETED ---');
  } catch (error) {
    console.error('Test script encountered an error:', error.message);
  }
};

runTests();
