import bcrypt from 'bcrypt';
import { pool } from './db.js';

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await client.query(
      `INSERT INTO users (email, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['admin@zenithweave.com', hashedPassword]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Demo admin user created:');
      console.log('   Email: admin@zenithweave.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    } else {
      console.log('ℹ️  Demo user already exists');
    }
    
    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
