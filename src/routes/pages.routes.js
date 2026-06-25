const express = require("express");
const router = express.Router();

const {
  getHomePageData,getDashboardData
} = require("../controllers/pages.controller");
const isAuthenticated = require('../middlewares/auth.middleware.js');
router.use(isAuthenticated);
router.get("/pages/home", getHomePageData);
router.get("/pages/dashboard", getDashboardData);

module.exports = router;