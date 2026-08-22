import http from 'http';
import fs from 'fs';
import path from 'path';

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function login() {
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'renttrackowner@gmail.com', password: 'RentrackOwner' }));

  console.log('Login status:', loginRes.status);
  console.log('Login success:', loginRes.body.success);

  if (!loginRes.body.success) {
    console.log('Login error:', loginRes.body.error);
    return null;
  }

  return loginRes.headers['set-cookie'];
}

async function uploadImage(cookies) {
  const boundary = '----FormBoundary' + Date.now();
  const imagePath = path.join('public', 'images', 'landing', 'logo.png');

  if (!fs.existsSync(imagePath)) {
    console.log('Test image not found at:', imagePath);
    return null;
  }

  const imageData = fs.readFileSync(imagePath);
  const mimeType = 'image/jpeg';

  const header = '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n' +
    'Content-Type: ' + mimeType + '\r\n\r\n';

  const footer = '\r\n--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="type"\r\n\r\n' +
    'avatar\r\n--' + boundary + '--\r\n';

  const bodyBuffer = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    imageData,
    Buffer.from(footer, 'utf-8')
  ]);

  const uploadRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Cookie': cookies ? cookies.join('; ') : ''
    }
  }, bodyBuffer);

  console.log('Upload status:', uploadRes.status);
  console.log('Upload success:', uploadRes.body.success);
  console.log('Upload URL:', uploadRes.body.url);
  console.log('Upload error:', uploadRes.body.error);

  return uploadRes.body;
}

async function checkUser(cookies) {
  const meRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Cookie': cookies ? cookies.join('; ') : ''
    }
  });

  console.log('Me status:', meRes.status);
  console.log('avatar_url:', meRes.body.user?.avatar_url);
  console.log('id_verification_url:', meRes.body.user?.id_verification_url);
}

async function main() {
  try {
    const cookies = await login();
    if (!cookies) return;

    console.log('\n--- Before upload ---');
    await checkUser(cookies);

    console.log('\n--- Uploading image ---');
    const uploadResult = await uploadImage(cookies);

    if (uploadResult && uploadResult.success) {
      console.log('\n--- After upload ---');
      await checkUser(cookies);

      if (uploadResult.url) {
        console.log('\n--- Testing upload URL ---');
        const uploadId = uploadResult.url.split('/').pop();
        const imgRes = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: '/api/auth/upload/' + uploadId,
          method: 'GET'
        });
        console.log('Image status:', imgRes.status);
        console.log('Image content-type:', imgRes.headers['content-type']);
        console.log('Image content-length:', imgRes.headers['content-length']);
        console.log('Image body length:', imgRes.body.length);
        console.log('Image body type:', typeof imgRes.body);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
