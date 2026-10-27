import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testApi() {
  const port = process.env.PORT || 7101;
  const baseUrl = `http://localhost:${port}/api`;

  console.log('Testing login to get admin token...');
  let token;
  try {
    const loginRes = await axios.post(`${baseUrl}/admin/login`, {
      email: 'test1@gmail.com',
      password: 'password123'
    });
    token = loginRes.data.token;
    console.log('Logged in with test1@gmail.com');
  } catch (e) {
    try {
      const loginRes = await axios.post(`${baseUrl}/admin/login`, {
        email: process.env.ADMIN_EMAIL || 'admin@kea.local',
        password: process.env.ADMIN_PASSWORD || 'AdminPass123'
      });
      token = loginRes.data.token;
      console.log('Logged in with default admin');
    } catch (e2) {
      console.error('Login failed:', e2.response?.data || e2.message);
      return;
    }
  }

  console.log('Calling GET /admin/members...');
  const res = await axios.get(`${baseUrl}/admin/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const { members, pagination, stats } = res.data;
  console.log('Total members returned:', members.length);
  console.log('Pagination:', pagination);
  console.log('Stats:', stats);
  
  const rolesFound = members.map(m => ({ name: m.name, email: m.email, role: m.role }));
  console.log('Members in response:');
  console.table(rolesFound);

  const hasAdmin = members.some(m => m.role === 'admin' || m.role === 'superadmin');
  if (hasAdmin) {
    console.error('❌ FAIL: Response still contains admin accounts!');
  } else {
    console.log('✅ PASS: Only regular users are returned! No admins present.');
  }
}

testApi().catch(console.error);
