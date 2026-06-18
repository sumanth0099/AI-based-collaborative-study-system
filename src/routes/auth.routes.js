const express = require("express")
const router = express.Router();
const {
  googleAuthRedirect,
  googleCallback
} = require("../controllers/auth.google");
const {
  userLogout, userRegister, userLogin
} = require("../controllers/auth.manualUser");
router.get("/google", googleAuthRedirect);
router.get('/google/callback', googleCallback);

router.post('/register', userRegister);
router.post('/login', userLogin);
router.post('/logout', userLogout);
module.exports = router;