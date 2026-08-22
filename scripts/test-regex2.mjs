const raw = '\\x69\\x56\\x42\\x4f\\x52';
console.log('Raw:', raw);
console.log('Raw length:', raw.length);

const pattern = /\\x([0-9a-fA-F]{2})/g;
let match;
while ((match = pattern.exec(raw)) !== null) {
  console.log('Match:', match[0], 'hex:', match[1], 'char:', String.fromCharCode(parseInt(match[1], 16)));
}

const result = raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
console.log('Result:', result);
console.log('Result length:', result.length);
