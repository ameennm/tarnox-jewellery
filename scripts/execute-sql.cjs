require('dotenv').config();
const fs = require('fs');
const path = require('path');

const projectRef = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_SECRET_KEY;

async function executeSql() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing SQL schema...');
  
  // Note: Using the Supabase Management API to execute SQL
  // This endpoint expects a query object
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/queries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('SQL executed successfully!');
      // console.log(result);
    } else {
      console.error('Error executing SQL:', result.message || result);
    }
  } catch (error) {
    console.error('Failed to connect to Supabase API:', error.message);
  }
}

executeSql();
