require('dotenv').config();
const pool = require('./pool');
const { autoMigrate } = require('./autoMigrate');
const { seedFromDataJson, syncDataJson } = require('./syncDataJson');

async function seed() {
  try {
    console.log('⏳ Running auto-migration and seeding 48 complaints from data.json...');
    await autoMigrate();
    await seedFromDataJson();
    await syncDataJson();
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
