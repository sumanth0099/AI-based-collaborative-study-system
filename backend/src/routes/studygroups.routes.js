const express = require('express');
const router = express.Router();
const studyGroupController= require('../controllers/studygroups.controller.js');
const isAuthenticated = require('../middlewares/auth.middleware.js');
const isGroupOwner= require('../middlewares/isGroupOwner.js');

router.use(isAuthenticated);
router.get('/search',studyGroupController.searchGroups);
router.post('/',studyGroupController.createGroup);
router.get('/',studyGroupController.getAllGroups);
router.get('/:id',studyGroupController.getGroupById);
router.put('/:id', isGroupOwner, studyGroupController.updateGroup);
router.delete('/:id',isGroupOwner,studyGroupController.deleteGroup);

module.exports = router;