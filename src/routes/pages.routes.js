const express = require("express");
const router = express.Router();

const {
  getHomePageData,getDashboardData
} = require("../controllers/pages.controller");

router.get("/pages/home", getHomePageData);
router.get("/pages/dashboard", getDashboardData);

module.exports = router;