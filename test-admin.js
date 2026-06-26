async function testAdminLogin() {
  const API = 'http://localhost:5005/api';
  console.log('Attempting admin login...');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dilsediltakjindarahegehameshamerijaanmujebolldhinchak_kadhinchakchakchakchak',
      password: 'maerddreammardkokabhidardnahihotahotatowomardnahihota2211@2211'
    })
  });
  const data = await res.json();
  console.log('Admin Login Response:', data);
}
testAdminLogin();
