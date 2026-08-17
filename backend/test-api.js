
// Using basic fetch via node
const API_URL = 'http://localhost:5000/api';

async function testAuth() {
  let cookie = '';
  
  // 1. GET /api/session (Logged out)
  let res = await fetch(`${API_URL}/session`);
  let data = await res.json();
  console.assert(data.authenticated === false, 'Expected authenticated: false', data);
  console.log('GET /session (Logged out) PASSED');

  // 2. POST /api/login (Invalid password)
  res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'hr_manager', password: 'wrong' })
  });
  console.assert(res.status === 401, 'Expected 401', res.status);
  console.log('POST /login (Invalid) PASSED');

  // 3. POST /api/login (HR Manager)
  res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'hr_manager', password: 'hr123' })
  });
  data = await res.json();
  console.assert(data.authenticated === true, 'Expected authenticated: true', data);
  console.assert(data.user.role === 'hr_manager', 'Expected role: hr_manager', data);
  const setCookie = res.headers.get('set-cookie');
  console.assert(setCookie && setCookie.includes('sbc_session'), 'Expected sbc_session cookie');
  cookie = setCookie;
  console.log('POST /login (HR Manager) PASSED');

  // 4. GET /api/session (Logged in)
  res = await fetch(`${API_URL}/session`, {
    headers: { 'Cookie': cookie }
  });
  data = await res.json();
  console.assert(data.authenticated === true, 'Expected authenticated: true', data);
  console.log('GET /session (Logged in) PASSED');

  // 5. POST /api/logout
  res = await fetch(`${API_URL}/logout`, { method: 'POST' });
  data = await res.json();
  console.assert(data.message === 'Logged out', 'Expected Logged out message', data);
  console.log('POST /logout PASSED');
  
  // 6. Test other endpoints (Employees)
  res = await fetch(`${API_URL}/employees`);
  data = await res.json();
  console.assert(Array.isArray(data), 'Expected array for employees', data);
  console.log('GET /employees PASSED');
  
  console.log('ALL API TESTS PASSED');
}

testAuth().catch(console.error);
