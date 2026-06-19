    const express = require("express")
    const app = express()
    const session = require("express-session")
    app.use(express.json()) 
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
    const NoteRoutes = require("./src/routes/note.routes.js")
    const ResourceRoutes = require("./src/routes/resource.routes.js")
    const FriendsRoutes = require("./src/routes/friends.routes.js")
    app.use('/auth', Authroutes)
    app.use('/api/notes', NoteRoutes)
    app.use('/api/resources', ResourceRoutes)
    app.use('/api', FriendsRoutes)
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError &&
          err.status === 400 &&
          'body' in err) {
  
          return res.status(400).json({
              success: false,
              message: 'Invalid JSON format in request body'
          });
      }
  
      next(err);
  });
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    })