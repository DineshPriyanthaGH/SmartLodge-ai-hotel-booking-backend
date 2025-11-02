// Small script to test DB connectivity using project's DatabaseConnection
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { database } = require('../config/database');

(async () => {
  try {
    console.log('Attempting DB connect...');
    const ok = await database.connect();
    console.log('CONNECT_RESULT:', ok);
    console.log('CONNECTION_STATUS:', database.getConnectionStatus());
    if (ok) await database.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('CONNECT_ERROR:', err);
    process.exit(1);
  }
})();