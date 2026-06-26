
require("dotenv").config('./src');
const pool = require('../config.js');
  async function googleCallback(req,res){
    try {
        const code = req.query.code;
        if (!code) 
          return res.status(400).send("No code received from Google");
      
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
            console.error("Google Auth configuration missing in .env");
            return res.status(500).json({ error: "Google Auth is not configured on the server." });
        }

        // STEP 1: exchange code for token
        const tokenResponse = await fetch(
          "https://oauth2.googleapis.com/token",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              code,
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret:
                process.env.GOOGLE_CLIENT_SECRET,
              redirect_uri:process.env.GOOGLE_REDIRECT_URI,
              grant_type: "authorization_code"
            })
          }
        );
      
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            console.error("Google token error:", tokenData);
            return res.status(400).json({
              message: "Failed to get access token",
              tokenData
            });
          }
      
        // STEP 2: get user info from Google
        const userResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization:
                `Bearer ${tokenData.access_token}`
            }
          }
        );
      
        const user = await userResponse.json();
      
        // STEP 3: Find or Create user
        const result = await pool.query(
            `SELECT * FROM users WHERE google_id = $1`,
            [user.id]
          );
          
          let dbUser;
          
          if (result.rows.length === 0) {
            // Check if user with same email exists
            const emailResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [user.email]);
            if (emailResult.rowCount > 0) {
                // Link Google account to existing email
                const updateResult = await pool.query(
                    `UPDATE users SET google_id = $1, is_verified = true, updated_at = NOW() WHERE email = $2 RETURNING *`,
                    [user.id, user.email]
                );
                dbUser = updateResult.rows[0];
            } else {
                const insertResult = await pool.query(
                  `INSERT INTO users (
                    id, email, google_id, name, avatar, is_verified, created_at, updated_at
                  )
                  VALUES (
                    gen_random_uuid(),
                    $1, $2, $3, $4, true, NOW(), NOW()
                  )
                  RETURNING *`,
                  [
                    user.email,
                    user.id,
                    user.name,
                    user.picture
                  ]
                );
              
                dbUser = insertResult.rows[0];
            }
          } else {
            dbUser = result.rows[0];
          }
          req.session.userId = dbUser.id;
          req.session.email = dbUser.email;
          req.session.username = dbUser.name;
    
          // Redirect to frontend app after successful Google auth
          const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
          res.redirect(`${FRONTEND_URL}/home`);
    } catch (error) {
        console.error("Google Callback Error:", error);
        res.status(500).send("Internal Server Error during Google Authentication");
    }
}
 function googleAuthRedirect(req,res){
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
        console.error("Google Auth configuration missing in .env");
        return res.status(500).json({ error: "Google Auth is not configured on the server." });
    }
    const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri:process.env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile"
    });
    res.redirect(url);
}


module.exports = {
    googleCallback,
    googleAuthRedirect
  };


console.log(process.env.GOOGLE_CLIENT_ID);
