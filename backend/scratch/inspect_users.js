import { query } from '../src/db.js';

async function checkUsers() {
  try {
    const columns = await query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Users Columns:', JSON.stringify(columns.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkUsers();
