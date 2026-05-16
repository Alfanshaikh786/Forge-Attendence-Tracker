import { query } from '../src/db.js';

async function checkSchema() {
  try {
    const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
    console.log(res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();
