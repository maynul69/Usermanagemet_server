const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err)=>{
  if(err){
    console.log('====================================');
    console.log(err);
    console.log('====================================');
  }else{
    console.log('====================================');
    console.log("database connection successfully");
    console.log('====================================');
  }
})

module.exports = pool;
