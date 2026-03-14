require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const projectRef = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
const host = `db.${projectRef}.supabase.co`;

const client = new Client({
  host: host,
  port: 5432,
  user: 'postgres',
  password: password,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('Connecting to Postgres...');
    await client.connect();
    console.log('Connected! Executing schema...');
    
    // Split SQL into individual statements if necessary, 
    // but client.query can often handle multiple statements.
    await client.query(sql);
    
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Connection/Execution error:', err.message);
  } finally {
    await client.end();
  }
}

run();
