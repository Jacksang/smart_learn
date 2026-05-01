/**
 * Seed Demo Data for Student Workflow
 * Creates project + outline + questions for testsheng@example.com
 * Usage: node scripts/seed-demo-data.js
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let token = null;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, BASE);
    const opts = {
      hostname: u.hostname, port: u.port, path: u.pathname,
      method, headers: { 'Content-Type': 'application/json' },
    };
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

async function seed() {
  console.log('🌱 Seeding demo data...\n');

  // 1. Login
  console.log('1. Logging in as testsheng@example.com...');
  const login = await req('POST', '/api/users/login', {
    email: 'testsheng@example.com',
    password: 'TestPass123!',
  });
  if (login.status !== 200) {
    // Try registering
    console.log('   User not found, registering...');
    const reg = await req('POST', '/api/users/register', {
      name: 'Test Sheng',
      email: 'testsheng@example.com',
      password: 'TestPass123!',
    });
    if (reg.status === 201) {
      token = reg.body.token;
      console.log('   ✅ Registered and logged in');
    } else {
      console.log('   ❌ Failed:', reg.body);
      process.exit(1);
    }
  } else {
    token = login.body.token;
    console.log('   ✅ Logged in');
  }

  // 2. Create project
  console.log('\n2. Creating project...');
  const proj = await req('POST', '/api/projects', {
    title: 'Introduction to Biology',
    description: 'Learn the fundamentals of cell biology and genetics',
    subject: 'Biology',
  });
  const projectId = proj.body.project?.id;
  console.log(`   ${proj.status === 201 ? '✅' : '⚠️'}  Project: ${projectId}`);

  // 3. Create outline
  if (projectId) {
    console.log('\n3. Creating outline...');
    const outline = await req('POST', `/api/projects/${projectId}/outline`, {
      title: 'Biology Fundamentals',
    });
    const outlineId = outline.body?.data?.outline?.id || outline.body?.outline?.id;
    console.log(`   ${outline.status === 201 ? '✅' : '⚠️'}  Outline: ${outlineId}`);
  }

  // 4. Create session  
  if (projectId) {
    console.log('\n4. Creating learning session...');
    const session = await req('POST', `/api/projects/${projectId}/sessions`, {
      mode: 'learn',
    });
    const sessionId = session.body?.data?.session?.id;
    console.log(`   ${session.status === 201 || session.status === 200 ? '✅' : '⚠️'}  Session: ${sessionId}`);
  }

  console.log('\n✅ Seed complete!');
  console.log('   Login: testsheng@example.com / TestPass123!');
  console.log('   Project: Introduction to Biology');
}

seed().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
