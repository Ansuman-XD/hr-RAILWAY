const fetch = require('node-fetch');
const { uid } = require('../../frontend/src/lib/storage');

function randInt(max){return Math.floor(Math.random()*max)}

(async ()=>{
  const count = 200;
  const employees = [];
  for(let i=0;i<count;i++){
    employees.push({
      id: 'emp-'+i+'-'+Date.now(),
      photo: '',
      name: 'Test User '+i,
      gender: 'Male',
      tokenNo: 'T'+(1000+i),
      hrmsId: 'H'+(1000+i),
      batch: 'B1',
      designation: 'D1',
      phone: '9999999999',
      email: '',
      bloodGroup: null,
      emergencyContact: '9999999999',
      address: 'Test',
      aadhaar: '111122223333',
      pan: 'ABCDE1234F',
      pfNumber: 'PF'+i,
      dob: '1990-01-01',
      doa: '2010-01-01',
      qualification: 'Grad',
      documents: [],
      status: 'Active'
    });
  }

  const body = JSON.stringify({ employees, batches: ['B1'], designations: ['D1'] });
  const start = Date.now();
  const res = await fetch('http://localhost:5000/api/employees/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const text = await res.text();
  const total = Date.now() - start;
  console.log('status', res.status, 'time_ms', total, 'body', text);
})();