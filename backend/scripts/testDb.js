import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  const uri = process.env.MONGODB_URI;
  console.log('Testing connection to:', uri ? uri.split('@')[1] : 'UNDEFINED');
  
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      dbName: process.env.MONGODB_DB
    });
    console.log('SUCCESS: Connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Could not connect to MongoDB');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error('\n--- TROUBLESHOOTING ---');
      console.error('1. Check if your current IP is whitelisted in MongoDB Atlas.');
      console.error('2. Check if your firewall blocks port 27017 or DNS SRV records.');
      console.error('3. Try using a standard connection string (mongodb://...) instead of SRV.');
    }
    process.exit(1);
  }
}

test();
