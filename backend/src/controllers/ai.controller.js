const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");

const getQuizTopics = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT ON (topic)
                id,
                topic,
                userId
            FROM notes
            WHERE topic IS NOT NULL
              AND topic != ''
              AND contentType = 'text'
              AND userId = $1
            ORDER BY topic, createdAt DESC;
        `;

        const result = await pool.query(query, [req.session.userId]);

        return res.status(200).json({
            topics: result.rows
        });

    } catch (error) {
        console.error("Error fetching quiz topics:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
const getQuiz = async (req, res) => {
    const { id, topic } = req.body;

    if (!id || !topic) {
        return res.status(400).json({
            success: false,
            message: "Please provide both note id and topic."
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT subject, topic, content, tags
            FROM notes
            WHERE id = $1
              AND topic = $2
              AND userId = $3
              AND contentType = 'text'
            `,
            [id, topic, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notes not found."
            });
        }

        const note = result.rows[0];

        const isValidQuiz = (data) => {
            if (!data?.quiz?.questions) return false;

            const questions = data.quiz.questions;

            if (!Array.isArray(questions)) return false;

            if (questions.length < 10 || questions.length > 20) {
                return false;
            }

            const uniqueQuestions = new Set();

            for (const q of questions) {
                if (!q.question?.trim()) return false;

                if (uniqueQuestions.has(q.question)) {
                    return false;
                }

                uniqueQuestions.add(q.question);

                if (!Array.isArray(q.options)) return false;

                if (q.options.length !== 4) return false;

                if (!q.correctAnswer) return false;

                if (!q.options.includes(q.correctAnswer)) {
                    return false;
                }

                if (!q.explanation?.trim()) return false;
            }

            return true;
        };

        const prompt = `
You are an expert educational quiz generator.

Target Audience:
Students aged 20-30.

Create a quiz ONLY from the provided study material.

Requirements:

1. Generate between 10 and 20 MCQs.
2. Each question must have exactly 4 options.
3. One correct answer.
4. Include explanation.
5. Questions should test understanding and practical knowledge.
6. No duplicate questions.
7. Return ONLY valid JSON.
8. Do NOT wrap JSON in markdown.
9. Do NOT include backticks.

Response Format:

{
  "success": true,
  "message": "Motivational message for student",
  "quiz": {
    "subject": "${note.subject}",
    "topic": "${note.topic}",
    "difficulty": "easy|medium|hard",
    "totalQuestions": 0,
    "estimatedTimeMinutes": 0,
    "questions": [
      {
        "id": 1,
        "question": "",
        "options": ["","","",""],
        "correctAnswer": "",
        "explanation": ""
      }
    ]
  }
}

Study Material:

Subject: ${note.subject}

Topic: ${note.topic}

Tags: ${(note.tags || []).join(", ")}

Content:
${note.content}
`;

        let quizData = null;
        let attempt = 0;
        const MAX_ATTEMPTS = 3;

        while (attempt < MAX_ATTEMPTS) {
            attempt++;

            try {
                const groqResponse = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.GROQ_API_KEY2}`
                        },
                        body: JSON.stringify({
                            model: "llama-3.3-70b-versatile",
                            temperature: 0.3,
                            response_format: {
                                type: "json_object"
                            },
                            messages: [
                                {
                                    role: "system",
                                    content:
                                        "You generate educational quizzes and always return valid JSON."
                                },
                                {
                                    role: "user",
                                    content: prompt
                                }
                            ]
                        })
                    }
                );

                if (!groqResponse.ok) {
                    console.error(
                        `Groq API failed on attempt ${attempt}`
                    );
                    continue;
                }

                const groqData = await groqResponse.json();

                const content =
                    groqData?.choices?.[0]?.message?.content;

                if (!content) {
                    continue;
                }

                const parsed = JSON.parse(content);

                if (isValidQuiz(parsed)) {
                    quizData = parsed;
                    break;
                }

                console.warn(
                    `Quiz validation failed on attempt ${attempt}`
                );

            } catch (err) {
                console.error(
                    `Quiz generation attempt ${attempt} failed`,
                    err
                );
            }
        }

        if (!quizData) {
            return res.status(200).json({
                success: false,
                message:
                    "📚 We couldn't generate a quiz from your notes right now. This usually happens when the notes contain too little information or our AI service is temporarily busy. Try again in a few minutes or add more detailed study material.",
                quiz: null
            });
        }

        return res.status(200).json(quizData);

    } catch (error) {
        console.error("Error generating quiz:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
const submitQuiz = async (req, res) => {
    try {
        const {
            noteId,
            subject,
            topic,
            difficulty,
            totalQuestions,
            answers
        } = req.body;

        if (
            !topic ||
            !subject ||
            !totalQuestions ||
            !Array.isArray(answers)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz submission."
            });
        }

        let correctAnswers = 0;

        for (const answer of answers) {
            if (
                answer.selectedAnswer &&
                answer.selectedAnswer === answer.correctAnswer
            ) {
                correctAnswers++;
            }
        }

        const wrongAnswers =
            totalQuestions - correctAnswers;

        const maxMarks = totalQuestions;

        const obtainedMarks = correctAnswers;

        const percentage = Number(
            ((obtainedMarks / maxMarks) * 100).toFixed(2)
        );

        await pool.query(
            `
            INSERT INTO quiz_attempts (
                id,
                userId,
                noteId,
                subject,
                topic,
                difficulty,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                maxMarks,
                obtainedMarks,
                percentage
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )
            `,
            [
                createID(),
                req.session.userId,
                noteId,
                subject,
                topic,
                difficulty,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                maxMarks,
                obtainedMarks,
                percentage
            ]
        );

        let title = "";
        let message = "";

        if (percentage >= 90) {
            title = "🏆 Outstanding!";
            message =
                "Excellent work! You've mastered this topic and your dedication is paying off.";
        } else if (percentage >= 75) {
            title = "🎉 Great Job!";
            message =
                "You're building strong understanding. Keep practicing and you'll reach mastery.";
        } else if (percentage >= 50) {
            title = "📚 Good Progress!";
            message =
                "You've got a solid foundation. Review a few concepts and try again.";
        } else {
            title = "💪 Keep Going!";
            message =
                "Every attempt helps you learn. Review the explanations and come back stronger.";
        }

        return res.status(200).json({
            success: true,
            result: {
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                maxMarks,
                obtainedMarks,
                percentage
            },
            message: {
                title,
                content: message
            }
        });

    } catch (error) {
        console.error("Quiz submission error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const generateFlashcards = async (req, res) => {
    const { id, topic } = req.body;

    try {
        const result = await pool.query(
            `
            SELECT subject, topic, content, tags
            FROM notes
            WHERE id = $1
            AND topic = $2
            AND userId = $3
            AND contentType = 'text'
            `,
            [id, topic, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notes not found"
            });
        }

        const note = result.rows[0];

        const prompt = `
Generate 10-20 flashcards.

Return ONLY JSON.

{
  "success": true,
  "message": {
    "title": "🧠 Flashcards Ready!",
    "content": "Review these concepts and strengthen your understanding."
  },
  "flashcards": [
    {
      "id": 1,
      "front": "",
      "back": ""
    }
  ]
}

Study Material:

${note.content}
`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    response_format: {
                        type: "json_object"
                    },
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        return res.status(200).json(
            JSON.parse(data.choices[0].message.content)
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate flashcards."
        });
    }
};
const chatWithAssistant = async (req, res) => {
    const { id, topic, question } = req.body;

    if (!question) {
        return res.status(400).json({
            success: false,
            message: "Question is required"
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT content
            FROM notes
            WHERE id = $1
            AND topic = $2
            AND userId = $3
            `,
            [id, topic, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notes not found"
            });
        }

        const prompt = `
You are a friendly study assistant.

Rules:

1. Answer ONLY using provided notes.
2. If answer isn't found say:
   "I couldn't find that information in your notes."
3. Use simple language.
4. Give examples when possible.

Return JSON only.

{
  "success": true,
  "answer": {
    "title": "",
    "content": ""
  }
}

Notes:

${result.rows[0].content}

Question:

${question}
`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    response_format: {
                        type: "json_object"
                    },
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        return res.status(200).json(
            JSON.parse(data.choices[0].message.content)
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Assistant unavailable"
        });
    }
};

const generateSummary = async (req, res) => {
    const { id, topic } = req.body;

    try {
        const result = await pool.query(
            `
            SELECT subject, topic, content
            FROM notes
            WHERE id=$1
            AND topic=$2
            AND userId=$3
            `,
            [id, topic, req.session.userId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Notes not found"
            });
        }

        const note = result.rows[0];

        const prompt = `...`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    response_format: {
                        type: "json_object"
                    },
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        return res.json(
            JSON.parse(data.choices[0].message.content)
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate summary."
        });
    }
};
const generateImportantQuestions = async (req, res) => {
    const { id, topic } = req.body;

    try {
        const result = await pool.query(
            `
            SELECT subject, topic, content
            FROM notes
            WHERE id=$1
            AND topic=$2
            AND userId=$3
            `,
            [id, topic, req.session.userId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Notes not found"
            });
        }

        const note = result.rows[0];

        const prompt = `...`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    response_format: {
                        type: "json_object"
                    },
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        return res.json(
            JSON.parse(data.choices[0].message.content)
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to generate important questions."
        });
    }
};
const getTopics = (req,res)=>{
    return res.status(200).json({
        success:true,
        topics:[
            "Quiz Generation",
            "Flashcards Generation",
            "Chat with Assistant",
            "Summary Generation",
            "Important Questions Generation"
        ]
    })
}
module.exports = {
    getTopics,
    getQuizTopics,getQuiz,
    submitQuiz,generateFlashcards,
    chatWithAssistant,generateSummary,
    generateImportantQuestions
};