const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string provided by the user
const connectionString = 'postgresql://postgres:Tarnox%402026@db.gswdafmvccbstojgaxlc.supabase.co:5432/postgres';

async function executeSchema() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260314000000_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Connecting to Tarnox Jewellery Database...');
    await client.connect();
    console.log('Connected! Executing schema...');
    
    await client.query(sql);
    
    console.log('Database schema initialized successfully via terminal!');
  } catch (err) {
    console.error('Database Error:', err.message);
  } finally {
    await client.end();
  }
}

executeSchema();
