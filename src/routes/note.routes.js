const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller.js');
const isAuthenticated = require('../middlewares/auth.middleware.js');

// Apply authentication middleware to all note routes
router.use(isAuthenticated);

// Order matters: specific routes before parameterized routes
router.get('/search', noteController.searchNotes);
router.get('/', noteController.getAllNotes);
router.get('/:id', noteController.getNoteById);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
