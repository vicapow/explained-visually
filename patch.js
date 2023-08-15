var fs = require('fs');
var ncp = fs.readFileSync('./node_modules/ncp/lib/ncp.js', 'utf-8');
ncp = ncp.replace(`const modern = /^v0\\.1\\d\\.\\d+$/.test(process.version);`, `const modern = true;`);
fs.writeFileSync('./node_modules/ncp/lib/ncp.js', ncp);