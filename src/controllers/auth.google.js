
require("dotenv").config('./src');
 async function googleCallback(req,res){
    const code = req.query.code;
    if (!code) 
      return res.send("No code received");
  
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
  
    // STEP 3: show result (for now)
    const result = await pool.query(
        `SELECT * FROM users WHERE google_id = $1`,
        [user.id]
      );
      
      let dbUser;
      
      if (result.rows.length === 0) {
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
      } else {
        dbUser = result.rows[0];
      }
      req.session.userId = dbUser.id;
      req.session.email = dbUser.email;

      res.json({
        message: "Login successful",
        user: dbUser
      });
}
 function googleAuthRedirect(req,res){
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
