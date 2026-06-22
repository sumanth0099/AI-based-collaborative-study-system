const express = require('express');
const router = express.Router();
const {
  handleFriendRequest,getMyFrnds,postFriendRequest
  } = require("../controllers/friends.controller");
router.post('/friends-request/action',handleFriendRequest)
router.get('/get-friends',getMyFrnds);
router.post('/friend-requests/send', postFriendRequest);
module.exports = router;