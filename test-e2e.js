const fs = require('fs');
const path = require('path');

async function runTests() {
  const API = 'http://localhost:5005/api';
  console.log('Testing Interakt E2E API Flow...');

  // Clean up any existing test user using the test UID or email to allow repeat runs
  const usersPath = path.join(__dirname, 'apps/api/data/users.json');
  if (fs.existsSync(usersPath)) {
    try {
      let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const originalCount = users.length;
      users = users.filter(u => u.uid !== '24BCA01' && !u.email.startsWith('testuser_'));
      if (users.length !== originalCount) {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        console.log('🧼 Cleaned up prior test users from users.json');
      }
    } catch (err) {
      console.error('Error cleaning users.json:', err);
    }
  }

  // Test UID Validation - Attempt registration with INVALID UID (should fail)
  console.log('Verifying UID restriction (attempting registration with invalid UID)...');
  const badEmail = `baduser_${Date.now()}@test.com`;
  const badUsername = `baduser_${Date.now()}`;
  let badRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: badUsername,
      email: badEmail,
      password: 'password123',
      uid: 'INVALID_UID_999',
      phone: '1234567890'
    })
  });
  let badData = await badRes.json();
  if (badData.success) {
    console.error('❌ Security Failure: Registration succeeded with an invalid UID!');
    process.exit(1);
  }
  console.log('✅ Success: Registration rejected as expected for invalid UID:', badData.error);

  // 1. Register a test user
  const email = `testuser_${Date.now()}@test.com`;
  const username = `testuser_${Date.now()}`;
  const testUid = '24BCA01';
  console.log(`Registering ${username} (${email}) with UID ${testUid}...`);
  let res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password: 'password123',
      uid: testUid,
      phone: '9876543210'
    })
  });
  let registerData = await res.json();
  if (!registerData.success) {
    console.error('Registration failed:', registerData);
    process.exit(1);
  }
  const token = registerData.token;
  const userId = registerData.user.id;
  console.log('Registration success! Token received.');

  // 2. Login
  console.log('Logging in using UID as identifier...');
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testUid, password: 'password123' })
  });
  let loginData = await res.json();
  if (!loginData.success) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  console.log('Login success!');

  // 3. Get profile
  console.log('Fetching profile...');
  res = await fetch(`${API}/auth/profile/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let profileData = await res.json();
  if (!profileData.success) {
    console.error('Profile fetch failed:', profileData);
    process.exit(1);
  }
  console.log('Profile fetch success:', profileData.data.username);

  // 4. Create a post
  console.log('Creating a post...');
  res = await fetch(`${API}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text: 'Hello CampusHub! #elite', category: 'General' })
  });
  let postData = await res.json();
  if (!postData.success) {
    console.error('Post creation failed:', postData);
    process.exit(1);
  }
  const postId = postData.data._id;
  console.log('Post created successfully! Post ID:', postId);

  // 5. Add a comment
  console.log('Adding comment to post...');
  res = await fetch(`${API}/comments/${postId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text: 'This is an elite comment!' })
  });
  let commentData = await res.json();
  if (!commentData.success) {
    console.error('Adding comment failed:', commentData);
    process.exit(1);
  }
  console.log('Comment added successfully!');

  // 6. Get post comments
  console.log('Fetching comments...');
  res = await fetch(`${API}/comments/${postId}`);
  let commentsData = await res.json();
  if (!commentsData.success) {
    console.error('Fetching comments failed:', commentsData);
    process.exit(1);
  }
  console.log(`Fetched ${commentsData.count} comments successfully!`);

  console.log('🎉 E2E API Flow Verified Successfully! No issues found.');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
