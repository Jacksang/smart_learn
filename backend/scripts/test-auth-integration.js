const http = require('http');

const BASE = 'http://localhost:3000';
let token = null;
let user = null;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, BASE);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } 
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  console.log('🧪 Auth Integration Tests\n');
  let passed = 0, failed = 0;

  // 1. Register
  console.log('1. POST /api/users/register');
  const reg = await req('POST', '/api/users/register', {
    name: 'TestSheng',
    email: 'testsheng@example.com',
    password: 'TestPass123!',
  });
  if (reg.status === 201 && reg.body.token) {
    console.log('   ✅ Registered OK, got token');
    token = reg.body.token;
    user = reg.body.user;
    passed++;
  } else {
    console.log('   ❌ FAIL', reg.status, JSON.stringify(reg.body).slice(0, 100));
    failed++;
  }

  // 2. Verify user data
  console.log('\n2. POST /api/users/register — check user name');
  if (user && (user.name === 'TestSheng' || user.display_name === 'TestSheng')) {
    console.log('   ✅ Name is correct: TestSheng');
    passed++;
  } else {
    console.log('   ❌ Name mismatch. Got:', JSON.stringify(user));
    failed++;
  }

  // 3. Get profile
  console.log('\n3. GET /api/users/me (with token)');
  const me = await req('GET', '/api/users/me');
  if (me.status === 200) {
    console.log('   ✅ Profile fetched:', JSON.stringify(me.body.user || me.body).slice(0, 150));
    passed++;
  } else {
    console.log('   ❌ FAIL', me.status, JSON.stringify(me.body).slice(0, 100));
    failed++;
  }

  // 4. Login with same credentials
  console.log('\n4. POST /api/users/login');
  token = null; // clear
  const login = await req('POST', '/api/users/login', {
    email: 'testsheng@example.com',
    password: 'TestPass123!',
  });
  if (login.status === 200 && login.body.token) {
    console.log('   ✅ Login OK, got token');
    token = login.body.token;
    user = login.body.user;
    passed++;
  } else {
    console.log('   ❌ FAIL', login.status, JSON.stringify(login.body).slice(0, 100));
    failed++;
  }

  // 5. Verify login returns correct name
  console.log('\n5. POST /api/users/login — check user name');
  if (user && (user.name === 'TestSheng' || user.display_name === 'TestSheng')) {
    console.log('   ✅ Name is correct after login: TestSheng');
    passed++;
  } else {
    console.log('   ❌ Name mismatch after login. Got:', JSON.stringify(user));
    failed++;
  }

  // 6. Profile endpoint returns full data
  console.log('\n6. GET /api/users/profile');
  const profile = await req('GET', '/api/users/profile');
  if (profile.status === 200) {
    const p = profile.body.user || profile.body.data?.user || profile.body.data || profile.body;
    console.log('   ✅ Profile:', JSON.stringify(p).slice(0, 200));
    passed++;
  } else {
    console.log('   ❌ FAIL', profile.status, JSON.stringify(profile.body).slice(0, 100));
    failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
