// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const resourceController = require('../controllers/resource.controller.js');
// const isAuthenticated = require('../middlewares/auth.middleware.js');

// router.use(isAuthenticated);
// const upload = multer({ storage: multer.memoryStorage() });

// router.post('/upload', upload.single('file'), resourceController.uploadResource);
// router.post('/share', resourceController.shareResource);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
    uploadResource,
    listResources,
    getResource,
    deleteResource,
    shareResource
} = require("../controllers/resource.controller");

// ⚠️ multer middleware (memory storage)
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * ---------------------------
 * RESOURCE ROUTES
 * ---------------------------
 */

// Upload resource
router.post("/upload", upload.single("file"), uploadResource);

// Share resource
router.post("/share", shareResource);

// Get all resources
router.get("/", listResources);

// Get single resource
router.get("/:id", getResource);

// Delete resource
router.delete("/:id", deleteResource);

module.exports = router;