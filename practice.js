const pool = require('./src/config.js');
async function createANDgetData(name){
    try{
        // await pool.query('DELETE FROM users where name = ayyagaru');
        result=await pool.query('DROP table users');
        console.log(result.rows);
        pool.end();
    }
    catch(err){
        console.error(err.message);
    }
}

createANDgetData("ayyagaru")