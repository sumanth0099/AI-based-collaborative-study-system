const express = require('express');
const router = express.Router();
const {
    postFriends,getMyFrnds,postFriendRequest
  } = require("../controllers/friends.controller");
router.post('/friends',postFriends)
router.get('/friends/:userId',getMyFrnds);
// router.post('/friend-requests', postFriendRequest);
module.exports = router;