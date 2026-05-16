import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './src/db.js';

dotenv.config();

async function fixIndex() {
  await connectDatabase();
  try {
    console.log('Dropping studentUsn_1 index...');
    try {
      await mongoose.connection.collection('users').dropIndex('studentUsn_1');
    } catch (e) { console.log('Index not found'); }

    console.log('Cleaning up null studentUsn and studentId...');
    await mongoose.connection.collection('users').updateMany(
      { studentUsn: null },
      { $unset: { studentUsn: "" } }
    );
    await mongoose.connection.collection('users').updateMany(
      { studentId: null },
      { $unset: { studentId: "" } }
    );
    console.log('Cleanup complete.');
  } catch (err) {
    console.log('Index drop failed or not found (this is fine):', err.message);
  } finally {
    process.exit(0);
  }
}

fixIndex();
