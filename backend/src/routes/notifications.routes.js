const express = require('express');
const router = express.Router();
const {
    getMyNotificationHistory,getNewNotification, markNotificationsSeen
  } = require("../controllers/notifications.controller");
  const isAuthenticated = require('../middlewares/auth.middleware.js');

  router.use(isAuthenticated);
router.get('/get-notifications/unseen',getNewNotification);
router.get('/get-notifications/history',getMyNotificationHistory);
router.post('/mark-read', markNotificationsSeen);

module.exports = router;