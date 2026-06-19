const express = require('express');
const router = express.Router();
const studyGroupController= require('../controllers/studygroups.controller.js');
const isAuthenticated = require('../middlewares/auth.middleware.js');
const isGroupAdmin = require('../middlewares/isGroupAdmin.js');

router.use(isAuthenticated);
router.get('/search',studyGroupController.searchGroups);
router.post('/',studyGroupController.createGroup);
router.get('/',studyGroupController.getAllGroups);
router.get('/:id',studyGroupController.getGroupById);
router.put('/:id', isGroupAdmin, studyGroupController.updateGroup);
router.delete('/:id',isGroupAdmin,studyGroupController.deleteGroup);
router.get('/search',studyGroupController.searchGroups);
module.exports = router;