import { query } from '../src/db.js';

async function checkFullSchema() {
  try {
    const tables = ['faculty', 'subjects', 'users'];
    for (const table of tables) {
      const res = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [table]);
      console.log(`Schema for ${table}:`, JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkFullSchema();
