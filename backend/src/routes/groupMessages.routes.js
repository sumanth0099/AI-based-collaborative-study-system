const express=require("express");
const router=express.Router();

const isAuthenticated=require("../middlewares/auth.middleware");
const groupMessageController=require("../controllers/groupMessagesController");

router.use(isAuthenticated);

router.get(
    "/groups/:groupId/messages",isAuthenticated,
    groupMessageController.getGroupMessages
);

module.exports=router;