import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = "mongodb://nishchalbhandari18_db_user:8sy7uw5ZT5oDllbV@ac-brupea8-shard-00-00.1nleqaz.mongodb.net:27017,ac-brupea8-shard-00-01.1nleqaz.mongodb.net:27017,ac-brupea8-shard-00-02.1nleqaz.mongodb.net:27017/forgetrack?ssl=true&replicaSet=atlas-d84pkp-shard-0&authSource=admin&appName=forgetrack";

async function test() {
  console.log('Testing standard connection string...');
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('SUCCESS: Connected to MongoDB using standard string!');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Still could not connect.');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

test();
