const express = require("express");
const router = express.Router();

const {
    getQuizTopics,
    getQuiz,
    submitQuiz,
    generateFlashcards,
    chatWithAssistant,
    generateSummary,
    generateImportantQuestions
} = require("../controllers/ai.controller");

router.get("/ai/quiz/available-options", getQuizTopics);
router.post("/ai/quiz/generate", getQuiz);
router.post("/ai/quiz/submit", submitQuiz);
router.post("/ai/flashcards/generate", generateFlashcards);
router.post("/ai/chat", chatWithAssistant);
router.post("/ai/summary/generate", generateSummary);
router.post(
    "/ai/important-questions/generate",
    generateImportantQuestions
);

module.exports = router;