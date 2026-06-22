const express = require('express');
const router = express.Router();
const {
  handleFriendRequest,
  getMyFrnds,
  postFriendRequest,
  getMyReceivedRequests,
  getAllUsers,
  searchUsers
  } = require("../controllers/friends.controller");
router.post('/friends-request/action',handleFriendRequest)
router.get('/get-friends',getMyFrnds);
router.post('/friend-requests/send', postFriendRequest);
router.get('get-reqests', getMyReceivedRequests);
router.get('/get-users',getAllUsers);
router.get('/search-users', searchUsers);
module.exports = router;