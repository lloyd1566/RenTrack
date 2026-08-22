const raw = '\\x6956424f5277304b47676f414141414e5355684555674141424f59414141546d434149414141414b6e6a6c394141426854';

console.log('Raw:', raw);
console.log('Raw length:', raw.length);
console.log('Char 0:', raw[0], raw.charCodeAt(0));
console.log('Char 1:', raw[1], raw.charCodeAt(1));
console.log('Char 2:', raw[2], raw.charCodeAt(2));
console.log('Char 3:', raw[3], raw.charCodeAt(3));

// Test different regex patterns
const patterns = [
  /\\x([0-9a-fA-F]{2})/g,
  /[\\]x([0-9a-fA-F]{2})/g,
  /\\\\x([0-9a-fA-F]{2})/g,
  /\x([0-9a-fA-F]{2})/g,
];

for (const pattern of patterns) {
  const result = raw.replace(pattern, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  console.log('Pattern', pattern, '-> length:', result.length, 'first 20:', result.slice(0, 20));
}

// Manual replacement
let manual = '';
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '\\' && raw[i + 1] === 'x' && i + 3 < raw.length) {
    const hex = raw.substring(i + 2, i + 4);
    manual += String.fromCharCode(parseInt(hex, 16));
    i += 3;
  } else {
    manual += raw[i];
  }
}
console.log('Manual -> length:', manual.length, 'first 20:', manual.slice(0, 20));

const decoded = Buffer.from(manual, 'base64');
console.log('Decoded length:', decoded.length);
console.log('First 8 bytes hex:', decoded.slice(0, 8).toString('hex'));
