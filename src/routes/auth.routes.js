const express = require("express")
const router = express.Router();
const {
    googleAuthRedirect,
    googleCallback
  } = require("../controllers/auth.google");
  
router.get("/google", googleAuthRedirect);
router.get('/google/callback',googleCallback);
module.exports = router;