import { query } from '../src/db.js';

const subjects = [
  { name: 'ARTIFICIAL INTELLIGENCE', code: 'BAI404T' },
  { name: 'ARTIFICIAL INTELLIGENCE LABORATORY', code: 'BAI405L' },
  { name: 'BIOLOGY FOR ENGINEERS', code: 'BBS409TC' },
  { name: 'DATA VISUALIZATION USING R', code: 'BAI408A2' },
  { name: 'DATABASE MANAGEMENT SYSTEM', code: 'BAI402G' },
  { name: 'DESIGN AND ANALYSIS OF ALGORITHMS', code: 'BAI401G' },
  { name: 'MATHEMATICAL FOUNDATIONS FOR DATA SCIENCE', code: 'BAI406W1' },
  { name: 'NATIONAL SERVICE SCHEME (NSS)', code: 'BNS410NK' },
  { name: 'PRINCIPLES OF OPERATING SYSTEMS', code: 'BAI403T' },
  { name: 'UHV-2: UNDERSTANDING HARMONY AND ETHICAL CONDUCT', code: 'BHU407TK' },
  { name: 'OBJECT ORIENTED PROGRAMMING', code: 'BAI303G' },
  { name: 'DATA STRUCTURES AND APPLICATIONS', code: 'BAI304T' },
  { name: 'DATA STRUCTURES LABORATORY', code: 'BAI305L' },
  { name: 'WEB DEVELOPMENT', code: 'BAI308A4' },
  { name: 'NSS', code: 'BNS309NK' },
  { name: 'INTRODUCTION TO DATA SCIENCE', code: 'BAI306W1' },
  { name: 'UHV-1: SOCIAL CONNECT AND RESPONSIBILITY', code: 'BHU307TK' },
  { name: 'STATISTICAL METHODS FOR AIML', code: 'BMA301TA' },
  { name: 'DIGITAL LOGIC DESIGN AND COMPUTER ORGANIZATION', code: 'BAI302G' }
];

async function seedSubjects() {
  try {
    console.log('Seeding subjects...');
    for (const sub of subjects) {
      await query(
        'INSERT INTO public.subjects (name, code) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = $1',
        [sub.name, sub.code]
      );
      console.log(`- Seeded: ${sub.name} (${sub.code})`);
    }
    console.log('Finished seeding subjects!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit();
  }
}

seedSubjects();
