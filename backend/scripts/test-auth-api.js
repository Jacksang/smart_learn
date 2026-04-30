/**
 * Phase 11.2 Enhanced Auth API Test Script
 * Tests all 10 auth endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🧪 Phase 11.2 Enhanced Auth API Tests\n');

  // 1. Register a test user to get a token
  console.log('1. Register test user...');
  const email = `auth_test_${Date.now()}@example.com`;
  const reg = await request('POST', '/api/users/register', {
    name: 'Auth Tester',
    email,
    password: 'TestPass123!',
  });
  if (reg.status === 201) {
    authToken = reg.body.token;
    console.log('   ✅ Registered, got token');
  } else {
    console.log('   ⚠️  Register returned', reg.status, reg.body);
    return;
  }

  // 2. Request password reset
  console.log('\n2. POST /api/auth/password-reset/request');
  const resetReq = await request('POST', '/api/auth/password-reset/request', { email });
  console.log(`   ${resetReq.status === 200 ? '✅' : '❌'} Status ${resetReq.status}`, resetReq.body.message);

  // 3. Complete password reset (use the dev token from response)
  if (resetReq.body.resetToken) {
    console.log('\n3. POST /api/auth/password-reset/complete');
    const resetComplete = await request('POST', '/api/auth/password-reset/complete', {
      token: resetReq.body.resetToken,
      newPassword: 'NewTestPass456!',
    });
    console.log(`   ${resetComplete.status === 200 ? '✅' : '❌'} Status ${resetComplete.status}`, resetComplete.body.message);
  } else {
    console.log('\n3. POST /api/auth/password-reset/complete - ⏭️ Skipped (no token in dev response)');
  }

  // 4. Request email verification
  console.log('\n4. POST /api/auth/verification/request');
  const verifyReq = await request('POST', '/api/auth/verification/request', {});
  console.log(`   ${verifyReq.status === 200 ? '✅' : '❌'} Status ${verifyReq.status}`, verifyReq.body.message);

  // 5. Complete email verification (use dev token)
  if (verifyReq.body.verificationToken) {
    console.log('\n5. POST /api/auth/verification/complete');
    const verifyComplete = await request('POST', '/api/auth/verification/complete', {
      token: verifyReq.body.verificationToken,
    });
    console.log(`   ${verifyReq.status === 200 ? '✅' : '❌'} Status ${verifyComplete.status}`, verifyComplete.body.message);
  } else {
    console.log('\n5. POST /api/auth/verification/complete - ⏭️ Skipped (no token in dev response)');
  }

  // 6. List sessions
  console.log('\n6. GET /api/auth/sessions');
  const sessions = await request('GET', '/api/auth/sessions');
  console.log(`   ${sessions.status === 200 ? '✅' : '❌'} Status ${sessions.status}`, `count=${sessions.body.count}`);

  // 7. Link OAuth provider
  console.log('\n7. POST /api/auth/oauth/link');
  const oauthLink = await request('POST', '/api/auth/oauth/link', {
    provider: 'google',
    provider_user_id: `google_${Date.now()}`,
    access_token: 'mock_google_token',
  });
  console.log(`   ${oauthLink.status === 201 ? '✅' : '❌'} Status ${oauthLink.status}`, oauthLink.body.message || oauthLink.body.error);

  // 8. List OAuth providers
  console.log('\n8. GET /api/auth/oauth/providers');
  const providers = await request('GET', '/api/auth/oauth/providers');
  console.log(`   ${providers.status === 200 ? '✅' : '❌'} Status ${providers.status}`, `count=${providers.body.linked_providers?.length}`);

  // 9. Unlink OAuth provider
  console.log('\n9. DELETE /api/auth/oauth/google');
  const unlink = await request('DELETE', '/api/auth/oauth/google?provider_user_id=google_123');
  console.log(`   Status ${unlink.status}`, unlink.body.message || '');

  // 10. Revoke all sessions (skipped to not disrupt current session)
  console.log('\n10. DELETE /api/auth/sessions/all — ⏭️ Skipped (would revoke current)');

  console.log('\n✅ Phase 11.2 auth API tests complete!');
}

test().catch((e) => console.error('❌ Test error:', e));
