const express = require('express');
const router = express.Router();
const {
    postFriends,getMyFrnds
  } = require("../controllers/friends.controller");
router.post('/friends',postFriends)
router.get('/friends/:userId',getMyFrnds);
module.exports = router;