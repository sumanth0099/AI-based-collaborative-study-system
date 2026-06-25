const pool = require('../config.js');
const { v4: uuidv4 } = require('uuid');

const createNote = async (req, res) => {
    try {
        const { groupId, name, subject, topic, content, contentType, topicImportance, tags, originalFileName, storedFileName, cloudinaryPublicId, cloudinaryUrl, fileSize, mimeType } = req.body;
        const userId = req.session.userId;
        const createdBy = req.session.userId;

        // Word count validation
        if (content) {
            const wordCount = content.trim().split(/\s+/).length;
            if (wordCount > 700) {
                return res.status(400).json({
                    error: "Content exceeds the 700-word limit",
                    wordCount: wordCount
                });
            }
        }

        const id = uuidv4();
        const now = new Date();

        const query = `
            INSERT INTO notes (
                id, userId, groupId, createdBy, name, subject, topic, content, contentType, 
                topicImportance, tags, originalFileName, storedFileName, 
                cloudinaryPublicId, cloudinaryUrl, fileSize, mimeType, createdAt, updatedAt
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *;
        `;

        const values = [
            id, userId, groupId, createdBy, name, subject, topic, content, contentType,
            topicImportance, tags, originalFileName, storedFileName,
            cloudinaryPublicId, cloudinaryUrl, fileSize, mimeType, now, now
        ];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating note:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAllNotes = async (req, res) => {
    try {
        const userId = req.session.userId;
        const result = await pool.query(
            'SELECT * FROM notes WHERE userid = $1 AND isArchived = FALSE ORDER BY createdAt DESC',
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error getting all notes:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const result = await pool.query(
            'SELECT * FROM notes WHERE id = $1 AND userid = $2 AND isArchived = FALSE',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Note not found or access denied" });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error getting note by ID:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const { name, subject, topic, content, contentType, topicImportance, tags, isArchived } = req.body;
        const now = new Date();

        const query = `
            UPDATE notes 
            SET name = COALESCE($1, name), 
                subject = COALESCE($2, subject), 
                topic = COALESCE($3, topic), 
                content = COALESCE($4, content), 
                contentType = COALESCE($5, contentType), 
                topicImportance = COALESCE($6, topicImportance), 
                tags = COALESCE($7, tags), 
                isArchived = COALESCE($8, isArchived),
                updatedAt = $9
            WHERE id = $10 AND userid = $11
            RETURNING *;
        `;

        const values = [name, subject, topic, content, contentType, topicImportance, tags, isArchived, now, id, userId];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Note not found or access denied" });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error updating note:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        // Soft delete
        const result = await pool.query(
            'UPDATE notes SET isArchived = TRUE, updatedAt = $1 WHERE id = $2 AND userid = $3 RETURNING *',
            [new Date(), id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Note not found or access denied" });
        }

        res.status(200).json({ message: "Note deleted successfully" });
    } catch (err) {
        console.error("Error deleting note:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const searchNotes = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.session.userId;
        if (!q) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const query = `
            SELECT * FROM notes 
            WHERE (topic ILIKE $1 OR subject ILIKE $1 OR content ILIKE $1) 
            AND userid = $2
            AND isArchived = FALSE
            ORDER BY createdAt DESC;
        `;
        const result = await pool.query(query, [`%${q}%`, userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error searching notes:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createNote,
    getAllNotes,
    getNoteById,
    updateNote,
    deleteNote,
    searchNotes
};
