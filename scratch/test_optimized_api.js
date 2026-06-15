async function run() {
  const adminEmail = 'test1@gmail.com';
  const adminPassword = '12345678';
  const baseUrl = 'http://localhost:7101/api';

  try {
    console.log("Logging in as admin...");
    const loginRes = await fetch(`${baseUrl}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed: ${errText}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in successfully! Token obtained.");

    const batchSize = 20000;
    
    for (let page = 1; page <= 3; page++) {
      console.log(`\nFetching batch ${page} (limit=${batchSize})...`);
      const start = Date.now();
      
      const res = await fetch(`${baseUrl}/admin/members?page=${page}&limit=${batchSize}&status=all&category=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fetch page ${page} failed: ${errText}`);
      }

      const data = await res.json();
      const duration = (Date.now() - start) / 1000;
      console.log(`Batch ${page} fetched successfully!`);
      console.log(`Records in batch: ${data.members?.length}`);
      console.log(`Time taken: ${duration.toFixed(2)} seconds`);
      console.log(`Payload size: ${(JSON.stringify(data.members).length / 1024 / 1024).toFixed(2)} MB`);
    }

  } catch (err) {
    console.error("Error running test:", err.message);
  }
}

run();
