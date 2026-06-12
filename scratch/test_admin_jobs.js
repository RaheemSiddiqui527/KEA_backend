async function test() {
  try {
    // Attempt admin login
    const loginRes = await fetch('http://localhost:7101/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test1@gmail.com',
        password: 'AdminPass123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful, token retrieved.');
    
    // Test Jobs
    const jobsRes = await fetch('http://localhost:7101/api/admin/jobs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const jobs = await jobsRes.json();
    console.log('Jobs returned:', jobs.length);

    // Test Job Applications
    const appsRes = await fetch('http://localhost:7101/api/admin/jobs/applications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!appsRes.ok) {
      throw new Error(`Fetch applications failed with status ${appsRes.status}: ${await appsRes.text()}`);
    }
    
    const apps = await appsRes.json();
    console.log('API call to /admin/jobs/applications returned', apps.length, 'applications.');
    if (apps.length > 0) {
      console.log('Sample application:', JSON.stringify(apps[0], null, 2));
    }
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

test();
