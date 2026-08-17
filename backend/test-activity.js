// test-activity.js
const API_URL = 'http://localhost:5000/api';

async function testActivity() {
  const res = await fetch(`${API_URL}/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor: 'System', action: 'Test Action', target: 'Test Target' })
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
}
testActivity().catch(console.error);
