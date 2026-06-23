const express = require("express");
const router = express.Router();

const {
    sendJoinRequest,
    getPendingRequests,
    approveRequest,
    rejectRequest
} = require("../controllers/joinRequestController");

router.post("/:groupId/request", sendJoinRequest);

router.get("/:groupId/requests", getPendingRequests);

router.put("/:groupId/requests/:userId/approve", approveRequest);

router.put("/:groupId/requests/:userId/reject", rejectRequest);

module.exports = router;