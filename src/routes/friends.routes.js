const express = require('express');
const router = express.Router();
const {
  handleFriendRequest,getMyFrnds,postFriendRequest
  } = require("../controllers/friends.controller");
router.post('/friends-request/action',handleFriendRequest)
router.get('/friends/:userId',getMyFrnds);
router.post('/friend-requests', postFriendRequest);
module.exports = router;