import { query } from '../src/db.js';

async function checkTables() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', result.rows.map(r => r.table_name));
    
    // Check sessions columns
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `);
    console.log('Sessions Columns:', columns.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkTables();
