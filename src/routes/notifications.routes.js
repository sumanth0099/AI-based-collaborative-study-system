const express = require('express');
const router = express.Router();
const {
    getMyNotificationHistory,getNewNotification
  } = require("../controllers/notifications.controller");
router.get('/get-notifications/unseen',getNewNotification);
router.get('/get-notifications/history',getMyNotificationHistory);

module.exports = router;