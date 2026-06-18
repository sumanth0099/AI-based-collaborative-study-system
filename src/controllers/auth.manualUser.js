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
async function userLogin(req, res) {
    try {
        const { email, password } = req.body;
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        req.session.userId = user.id;
        req.session.email = user.email;

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
