const fs = require('fs');
const file = fs.readFileSync('public/Recoleta-RegularDEMO.otf');
const base64 = file.toString('base64');
fs.writeFileSync('src/data/RecoletaFont.js', 'export const recoletaBase64 = "' + base64 + '";');
console.log('done!');
