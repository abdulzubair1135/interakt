const fs = require('fs');
const path = require('path');
const AllowedUid = require('./models/AllowedUid');

async function runUidMigration() {
  try {
    const uidsPath = path.join(__dirname, 'data', 'allowed_uids.json');
    if (!fs.existsSync(uidsPath)) {
      console.log('allowed_uids.json not found, skipping migration.');
      return;
    }

    const uidsData = JSON.parse(fs.readFileSync(uidsPath, 'utf8'));
    console.log(`Starting UID Migration: Found ${uidsData.length} UIDs in JSON file.`);

    let added = 0;
    let skipped = 0;

    for (const uid of uidsData) {
      const exists = await AllowedUid.findOne({ uid });
      if (!exists) {
        await AllowedUid.create({ uid, used: false });
        added++;
      } else {
        skipped++;
      }
    }

    console.log(`UID Migration Complete. Added: ${added}, Skipped (already exist): ${skipped}`);
  } catch (error) {
    console.error('UID Migration failed:', error);
  }
}

module.exports = runUidMigration;
