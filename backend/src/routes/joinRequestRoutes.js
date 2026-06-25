const express = require("express");
const router = express.Router();
const isAuthenticated=require("../middlewares/auth.middleware");
const {
    sendJoinRequest,
    getPendingRequests,
    approveRequest,
    rejectRequest
} = require("../controllers/joinRequestController");

router.post("/:groupId/request", isAuthenticated,sendJoinRequest);

router.get("/:groupId/requests",isAuthenticated, getPendingRequests);

router.put("/:groupId/requests/:userId/approve",isAuthenticated, approveRequest);

router.put("/:groupId/requests/:userId/reject",isAuthenticated, rejectRequest);

module.exports = router;