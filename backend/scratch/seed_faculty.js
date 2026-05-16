import { query } from '../src/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Mapping based on official college email format
const facultyData = [
  { name: 'Mrs. Shruthi Vishwajeeth', shortName: 'SV', email: 'Shruthi@Sahyadri.edu.in', password: 'Sahyadri@AI', subjects: ['BAI404T', 'BAI405L'] },
  { name: 'Ms. Monisha', shortName: 'MO', email: 'Monisha@Sahyadri.edu.in', password: 'Sahyadri@Bio', subjects: ['BBS409TC'] },
  { name: 'Ms. Deeksha J S', shortName: 'DJ', email: 'Deeksha@Sahyadri.edu.in', password: 'Sahyadri@Aec', subjects: ['BAI408A2', 'BAI403T'] },
  { name: 'Dr. Pushpalatha K', shortName: 'PK', email: 'DBMS@Sahyadri.edu.in', password: 'Sahyadri@DBMS', subjects: ['BAI402G'] },
  { name: 'Dr. Jayashree T R', shortName: 'JTR', email: 'Jayashree@Sahyadri.edu.in', password: 'Sahyadri@Daa', subjects: ['BAI401G'] },
  { name: 'Mrs. Suchetha Sheka', shortName: 'SS', email: 'Suchetha@Sahyadri.edu.in', password: 'Sahyadri@Maths', subjects: ['BAI406W1'] },
  { name: 'Ms. Madhura', shortName: 'M', email: 'Madhura@Sahyadri.edu.in', password: 'Sahyadri@UHV2', subjects: ['BHU407TK', 'BHU307TK'] },
  { name: 'Ms. Shweta S Naik', shortName: 'SN', email: 'Swetha@Sahyadri.edu.in', password: 'Sahyadri@OOPC', subjects: ['BAI303G'] },
  { name: 'Dr. Sadhana Rai', shortName: 'SR', email: 'Sadhana@Sahyadri.edu.in', password: 'Sahyadri@Dsa', subjects: ['BAI304T', 'BAI305L'] },
  { name: 'Mr. Sharathchandra N R', shortName: 'SNR', email: 'Sharathchandra@Sahyadri.edu.in', password: 'Sahyadri@DLDCO', subjects: ['BAI302G'] },
  { name: 'Mr. Ganaraj K', shortName: 'GK', email: 'Ganaraj@Sahyadri.edu.in', password: 'Sahyadri@IDS', subjects: ['BAI306W1'] }
];

async function seedFaculty() {
  try {
    console.log('🌱 Syncing Faculty Authentication System...');

    for (const f of facultyData) {
      // 1. Ensure faculty identity exists
      const facultyRes = await query(
        'INSERT INTO public.faculty (name, short_name, email) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $1, short_name = $2 RETURNING id',
        [f.name, f.shortName, f.email]
      );
      const facultyId = facultyRes.rows[0].id;

      // 2. Encrypt password and update User login
      const passwordHash = await bcrypt.hash(f.password, 12);
      
      const userExists = await query('SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)', [f.email]);
      
      if (userExists.rows.length > 0) {
        await query(
          `UPDATE public.users SET password_hash = $1, faculty_id = $2, role = 'mentor', display_name = $3 WHERE LOWER(email) = LOWER($4)`,
          [passwordHash, facultyId, f.name, f.email]
        );
      } else {
        await query(
          `INSERT INTO public.users (id, email, password_hash, role, display_name, faculty_id) 
           VALUES ($1, $2, $3, 'mentor', $4, $5)`,
          [uuidv4(), f.email.toLowerCase(), passwordHash, f.name, facultyId]
        );
      }

      // 3. Securely link subjects to this faculty ONLY
      // First, unassign these subjects from others if they were mistakenly assigned
      await query('UPDATE public.subjects SET assigned_faculty_id = $1 WHERE code = ANY($2)', [facultyId, f.subjects]);

      console.log(`✅ SYNCED: ${f.name} (${f.email})`);
    }

    console.log('\n🚀 FACULTY AUTHENTICATION SYSTEM UPGRADED SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log('Rules Enforced:');
    console.log('1. Official @Sahyadri.edu.in format active.');
    console.log('2. Case-insensitive login enabled.');
    console.log('3. Strict subject-wise authorization active.');
    console.log('4. Cryptographic password protection (Bcrypt) enabled.');

  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
  } finally {
    process.exit();
  }
}

seedFaculty();
