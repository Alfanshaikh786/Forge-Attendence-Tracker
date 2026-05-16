import { query } from '../src/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const facultyData = [
  { name: 'Mrs. Shruthi Vishwajeeth', shortName: 'SV', email: 'Shruthi', password: 'Sahyadri@AI', subjects: ['BAI404T', 'BAI405L'] },
  { name: 'Ms. Monisha', shortName: 'MO', email: 'Monisha', password: 'Sahyadri@Bio', subjects: ['BBS409TC'] },
  { name: 'Ms. Deeksha J S', shortName: 'DJ', email: 'Deeksha', password: 'Sahyadri@Aec', subjects: ['BAI408A2', 'BAI403T'] },
  { name: 'Dr. Pushpalatha K', shortName: 'PK', email: 'DBMS', password: 'Sahyadri@DBMS', subjects: ['BAI402G'] },
  { name: 'Dr. Jayashree T R', shortName: 'JTR', email: 'Jayashree', password: 'Sahyadri@Daa', subjects: ['BAI401G'] },
  { name: 'Mrs. Suchetha Sheka', shortName: 'SS', email: 'Suchetha', password: 'Sahyadri@Maths', subjects: ['BAI406W1'] },
  { name: 'Ms. Madhura', shortName: 'M', email: 'Madhura', password: 'Sahyadri@UHV2', subjects: ['BHU407TK', 'BHU307TK'] },
  { name: 'Ms. Shweta S Naik', shortName: 'SN', email: 'Swetha', password: 'Sahyadri@OOPC', subjects: ['BAI303G'] },
  { name: 'Dr. Sadhana Rai', shortName: 'SR', email: 'Sadhana', password: 'Sahyadri@Dsa', subjects: ['BAI304T', 'BAI305L'] },
  { name: 'Mr. Sharathchandra N R', shortName: 'SNR', email: 'Sharathchandra', password: 'Sahyadri@DLDCO', subjects: ['BAI302G'] },
  { name: 'Mr. Ganaraj K', shortName: 'GK', email: 'Ganaraj', password: 'Sahyadri@IDS', subjects: ['BAI306W1'] }
];

async function seedFaculty() {
  try {
    console.log('🌱 Seeding Faculty and Assignments...');

    for (const f of facultyData) {
      // 1. Create/Update Faculty identity
      const facultyRes = await query(
        'INSERT INTO public.faculty (name, short_name, email) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $1, short_name = $2 RETURNING id',
        [f.name, f.shortName, f.email]
      );
      const facultyId = facultyRes.rows[0].id;

      // 2. Create/Update User login
      const passwordHash = await bcrypt.hash(f.password, 12);
      
      // Check if user already exists
      const userExists = await query('SELECT id FROM public.users WHERE email = $1', [f.email]);
      
      if (userExists.rows.length > 0) {
        await query(
          `UPDATE public.users SET password_hash = $1, faculty_id = $2, role = 'mentor', display_name = $3 WHERE email = $4`,
          [passwordHash, facultyId, f.name, f.email]
        );
      } else {
        await query(
          `INSERT INTO public.users (id, email, password_hash, role, display_name, faculty_id) 
           VALUES ($1, $2, $3, 'mentor', $4, $5)`,
          [uuidv4(), f.email, passwordHash, f.name, facultyId]
        );
      }

      // 3. Link subjects
      for (const subCode of f.subjects) {
        await query(
          'UPDATE public.subjects SET assigned_faculty_id = $1 WHERE code = $2',
          [facultyId, subCode]
        );
      }

      console.log(`✅ Seeded: ${f.name} (${f.email}) -> [${f.subjects.join(', ')}]`);
    }

    console.log('🎉 Faculty Seeding Completed!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    process.exit();
  }
}

seedFaculty();
