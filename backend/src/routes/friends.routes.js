const express = require('express');
const router = express.Router();
const isAuthenticated = require("../middlewares/auth.middleware")
const {
  handleFriendRequest,
  getMyFrnds,
  postFriendRequest,
  getMyReceivedRequests,
  getAllUsers,
  searchUsers
  } = require("../controllers/friends.controller");
router.post('/friends-request/action',isAuthenticated,handleFriendRequest)
router.get('/get-friends',isAuthenticated,getMyFrnds);
router.post('/friend-requests/send',isAuthenticated, postFriendRequest);
router.get('/get-reqests',isAuthenticated, getMyReceivedRequests);
router.get('/get-users',isAuthenticated,getAllUsers);
router.get('/search-users',isAuthenticated, searchUsers);
module.exports = router;