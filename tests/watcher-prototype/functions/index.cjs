const {onRequest} = require('firebase-functions/v2/https');
exports.reloadProbe = onRequest((_request, response) => response.send('before-reload'));
