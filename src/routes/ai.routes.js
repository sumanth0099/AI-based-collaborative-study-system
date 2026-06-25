const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/auth.middleware")
const {
    getQuizTopics,
    getQuiz,
    submitQuiz,
    generateFlashcards,
    chatWithAssistant,
    generateSummary,
    generateImportantQuestions
} = require("../controllers/ai.controller");

router.get("/ai/quiz/available-options",isAuthenticated, getQuizTopics);
router.post("/ai/quiz/generate",isAuthenticated, getQuiz);
router.post("/ai/quiz/submit",isAuthenticated, submitQuiz);
router.post("/ai/flashcards/generate", isAuthenticated,generateFlashcards);
router.post("/ai/chat", isAuthenticated,chatWithAssistant);
router.post("/ai/summary/generate",isAuthenticated, generateSummary);
router.post(
    "/ai/important-questions/generate",
    isAuthenticated,generateImportantQuestions
);

module.exports = router;