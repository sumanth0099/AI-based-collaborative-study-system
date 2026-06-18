const express = require('express');
const router = express.Router();
const multer = require('multer');
const resourceController = require('../controllers/resource.controller.js');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), resourceController.uploadResource);
router.post('/share', resourceController.shareResource);

module.exports = router;
