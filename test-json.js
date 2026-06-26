const JSONStore = require('./apps/api/utils/jsonStore');
const userStore = new JSONStore('users');

async function test() {
  try {
    console.log('Testing JSON Store...');
    const users = await userStore.read();
    console.log('Current users:', users.length);
    
    const newUser = await userStore.create({
      username: 'testuser_' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    });
    console.log('Created user:', newUser._id);
    
    const allUsers = await userStore.read();
    console.log('All users after create:', allUsers.length);
    
    if (allUsers.length > users.length) {
      console.log('✅ JSON Store is working correctly!');
    } else {
      console.log('❌ JSON Store failed to save!');
    }
  } catch (err) {
    console.error('❌ Error during test:', err);
  }
}

test();
