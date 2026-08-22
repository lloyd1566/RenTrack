import http from 'http';

const postData = JSON.stringify({
  email: 'admin@renttrack.com',
  password: 'Adminrentrack'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(data);
  });
});

req.on('error', (e) => console.error(`Error: ${e.message}`));
req.write(postData);
req.end();
