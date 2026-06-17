    const express = require("express")
    const app = express()
    const session = require("express-session")
    app.use(
        session({
          secret: "mySuperSecretKey", // used to sign cookie (IMPORTANT)
          resave: false,              // don’t save if nothing changed
          saveUninitialized: false,   // don’t create empty sessions
          cookie: {
            httpOnly: true,           // protects from JS access
            secure: false,            // true only in HTTPS (production)
            maxAge: 1000 * 60 * 60 * 24 // 1 day session
          }
        })
      );
    const Authroutes = require("./src/routes/auth.routes.js")
    app.use('/auth',Authroutes)
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    })