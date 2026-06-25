require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../config.js");
const createID = require("../utils/generateuuid.js");
function userLogout(req,res){
    if(!req.session.userId || !req.session.email)
      return res.status(400).json({message:"User not logged in"});
    req.session.destroy(err => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }// Clear the session object
        res.clearCookie("connect.sid"); // Clear session cookie
        res.json({ message: "Logged out successfully" });
      });
}
async function userRegister(req,res){
    const {username,email, password } = req.body;
    if(!username || !email || !password)
      return res.status(400).json({ message: "Username, email, and password are required" });
    let checkUserNameExist = await pool.query("SELECT id FROM users WHERE name = $1", [username]);
    if(checkUserNameExist.rows.length > 0)
      return res.status(400).json({ message: "Username already exists" });
    if(password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    let checkEmailExist = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if(checkEmailExist.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });
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
      if(result.rowCount === 1){
        return res.status(201).json({ message: "User registered successfully" ,userId});
      }
}
catch(err){
    console.error("Error during registration:", err);
    return res.status(500).json({ message: "Registration failed" });
}

}


async function userLogin(req, res) {
    try {
        const {username, email, password } = req.body;
        if(!username && !email)
          return res.status(400).json({ message: "Username or email is required" });
        if(!password)
          return res.status(400).json({ message: "Password is required" });
        let query;
        let result;
        if(email && !username){
        query = 'SELECT * FROM users WHERE email = $1';
        result = await pool.query(query, [email]);
        }
        else{
        query = 'SELECT * FROM users WHERE name = $1';
        result = await pool.query(query, [username]);
        }

        if (result.rows.length === 0) 
            return res.status(401).json({ message: "Invalid Credentials" });

        const user = result.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) 
            return res.status(401).json({ message: "Invalid password" });
        

        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.username = user.name;

        res.status(200).json({ message: "Login successful", user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "Login failed" });
    }
}

module.exports = {
    userLogout,
    userRegister,
    userLogin
};
