const express = require("express")
const router = express.Router();
const {
  googleAuthRedirect,
  googleCallback
} = require("../controllers/auth.google");
const {
  userLogout, userRegister, userLogin
} = require("../controllers/auth.manualUser");
const isAuthenticated = require("../middlewares/auth.middleware")
router.get("/google", googleAuthRedirect);
router.get('/google/callback', googleCallback);

router.get('/me',isAuthenticated, (req, res) => {
  res.json({ userId: req.session.userId, email: req.session.email });
});
router.post('/register', userRegister);
router.post('/login', userLogin);
router.post('/logout',isAuthenticated, userLogout);
module.exports = router;