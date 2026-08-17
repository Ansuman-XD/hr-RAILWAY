// Native fetch on Node 22

const API_URL = 'http://localhost:5000/api';

async function testEmployees() {
  // Test POST
  let res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'emp-1234',
      name: 'Test Employee',
      gender: 'Male',
      tokenNo: 'T123',
      hrmsId: 'HRMS123',
      batch: '',
      designation: '',
      phone: '1234567890',
      emergencyContact: '0987654321',
      address: 'Test Address',
      aadhaar: '123412341234',
      pan: 'ABCDE1234F',
      pfNumber: 'PF123',
      dob: '1990-01-01',
      doa: '2015-01-01',
      qualification: 'BTech',
      status: 'Active',
      documents: [
        { id: 'doc-1', name: 'Test Doc', fileName: 'test.pdf', dataUrl: 'data:application/pdf;base64,1234' }
      ]
    })
  });
  
  if (res.status !== 201) {
    console.error('POST failed', await res.text());
    return;
  }
  console.log('POST /employees PASSED');
  
  // Test PUT
  res = await fetch(`${API_URL}/employees/emp-1234`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'emp-1234',
      name: 'Test Employee Updated',
      gender: 'Male',
      tokenNo: 'T123',
      hrmsId: 'HRMS123',
      batch: '',
      designation: '',
      phone: '1234567890',
      emergencyContact: '0987654321',
      address: 'Test Address Updated',
      aadhaar: '123412341234',
      pan: 'ABCDE1234F',
      pfNumber: 'PF123',
      dob: '1990-01-01',
      doa: '2015-01-01',
      qualification: 'BTech',
      status: 'Active',
      documents: []
    })
  });
  
  if (res.status !== 200) {
    console.error('PUT failed', await res.text());
    return;
  }
  console.log('PUT /employees/:id PASSED');
  
  console.log('ALL API TESTS PASSED');
}

testEmployees().catch(console.error);
