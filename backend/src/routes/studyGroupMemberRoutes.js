const express = require("express");
const router = express.Router();

const isAuthenticated = require("../middlewares/auth.middleware.js");
const studyGroupMemberController = require("../controllers/studyGroupMemberController.js");

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get groups joined by current user
router.get(
    "/my-groups",
    studyGroupMemberController.getMyGroups
);

// Join a group
router.post(
    "/:groupId/join",
    studyGroupMemberController.joinGroup
);

// Leave a group
router.delete(
    "/:groupId/leave",
    studyGroupMemberController.leaveGroup
);

// View group members
router.get(
    "/:groupId/members",
    studyGroupMemberController.getGroupMembers
);

// Owner only: Promote member → admin
router.put(
    "/:groupId/promote/:userId",
    studyGroupMemberController.promoteMember
);

// Owner only: Demote admin → member
router.put(
    "/:groupId/demote/:userId",
    studyGroupMemberController.demoteAdmin
);

// Owner/admin: Remove member
// Owner: Remove admin
router.delete(
    "/:groupId/remove/:userId",
    studyGroupMemberController.removeMember
);

module.exports = router;