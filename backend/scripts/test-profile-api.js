/**
 * Profile API Implementation - Testing Script
 * This script tests the new profile API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, path, body, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testProfileAPIs() {
  console.log('🧪 Testing Profile API Endpoints\n');
  
  try {
    // Step 1: Register a test user
    console.log('1️⃣  Testing User Registration...');
    const registerResult = await makeRequest('POST', '/api/users/register', {
      email: `test_profile_${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Test User',
      learningStyle: 'visual',
      gradeLevel: '10th'
    });
    
    if (registerResult.status !== 201) {
      console.error('   ❌ Registration failed');
      console.error('   Response:', registerResult.data);
      return;
    }
    
    const token = registerResult.data.token;
    console.log('   ✅ Registration successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Get user profile
    console.log('\n2️⃣  Testing Get Profile...');
    const getProfileResult = await makeRequest('GET', '/api/profile', null, token);
    
    if (getProfileResult.status !== 200) {
      console.error('   ❌ Get profile failed');
      console.error('   Response:', getProfileResult.data);
      return;
    }
    
    console.log('   ✅ Get profile successful');
    console.log('   User:', getProfileResult.data.user);
    
    // Step 3: Update profile
    console.log('\n3️⃣  Testing Update Profile...');
    const updateProfileResult = await makeRequest('PATCH', '/api/profile', {
      displayName: 'Updated Test User',
      bio: 'This is a test bio'
    }, token);
    
    if (updateProfileResult.status !== 200) {
      console.error('   ❌ Update profile failed');
      console.error('   Response:', updateProfileResult.data);
      return;
    }
    
    console.log('   ✅ Update profile successful');
    
    // Step 4: Update learning preferences
    console.log('\n4️⃣  Testing Update Learning Preferences...');
    const updateLearningResult = await makeRequest('PATCH', '/api/profile/preferences/learning', {
      dailyGoalMinutes: 45,
      preferredSessionLength: 30,
      difficultyLevel: 'intermediate',
      learningStyle: 'kinesthetic'
    }, token);
    
    if (updateLearningResult.status !== 200) {
      console.error('   ❌ Update learning preferences failed');
      console.error('   Response:', updateLearningResult.data);
      return;
    }
    
    console.log('   ✅ Update learning preferences successful');
    
    // Step 5: Update notification preferences
    console.log('\n5️⃣  Testing Update Notification Preferences...');
    const updateNotifResult = await makeRequest('PATCH', '/api/profile/preferences/notifications', {
      emailNotifications: true,
      pushNotifications: false,
      weeklySummary: true,
      streakReminders: true,
      achievementNotifications: true,
      learningTips: true
    }, token);
    
    if (updateNotifResult.status !== 200) {
      console.error('   ❌ Update notification preferences failed');
      console.error('   Response:', updateNotifResult.data);
      return;
    }
    
    console.log('   ✅ Update notification preferences successful');
    
    // Step 6: Get subscription info
    console.log('\n6️⃣  Testing Get Subscription Info...');
    const getSubscriptionResult = await makeRequest('GET', '/api/profile/subscription', null, token);
    
    if (getSubscriptionResult.status !== 200) {
      console.error('   ❌ Get subscription failed');
      console.error('   Response:', getSubscriptionResult.data);
      return;
    }
    
    console.log('   ✅ Get subscription successful');
    console.log('   Subscription:', getSubscriptionResult.data.subscription);
    
    console.log('\n✅ All API tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
  }
}

// Run tests
testProfileAPIs();
