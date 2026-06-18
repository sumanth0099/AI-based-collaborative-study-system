require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../config.js");
const createID = require("../utils/generateuuid.js");
function userLogout(req,res){
    req.session.destroy(err => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid"); // Clear session cookie
        res.json({ message: "Logged out successfully" });
      });
}
async function userRegister(req,res){
    const {username,email, password } = req.body;
    let userId = createID();
    let password_hash = bcrypt.hashSync(password, 10);
    const query = `
  INSERT INTO users (
    id, email, password_hash, name,
    google_id, avatar, is_verified,
    created_at, updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
`;
try{
  let result = await  pool.query(query, [
        userId,
        email,
        password_hash,
        username,
        null, // google_id
        null, // avatar
        false // is_verified
      ])
}
catch(err){
    console.error("Error during registration:", err);
    return res.status(500).json({ message: "Registration failed" });
}
}
