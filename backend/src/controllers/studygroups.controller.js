const pool = require("../config");
const { v4: uuidv4 } = require("uuid");

// const createGroup = async (req, res) => {
//     try {
//         const { name, description, avatar, isPrivate } = req.body;
//         const createdBy = req.session.userId;

//         if (!name) {
//             return res.status(400).json({
//                 message: "Group name is required"
//             });
//         }

//         const id = uuidv4();

//         const query = `
//             INSERT INTO study_groups (
//                 id,
//                 name,
//                 description,
//                 avatar,
//                 createdBy,
//                 isPrivate
//             )
//             VALUES ($1, $2, $3, $4, $5, $6)
//             RETURNING *;
//         `;

//         const values = [
//             id,
//             name,
//             description || null,
//             avatar || null,
//             createdBy,
//             isPrivate || false
//         ];

//         // Create group
//         const result = await pool.query(query, values);

//         // Add creator as admin in study_group_members
//         await pool.query(
//             `
//             INSERT INTO study_group_members (
//                 id,
//                 groupId,
//                 userId,
//                 role
//             )
//             VALUES ($1, $2, $3, $4)
//             `,
//             [
//                 uuidv4(),
//                 id,
//                 createdBy,
//                 "owner"
//             ]
//         );

//         res.status(201).json({
//             message: "Group created successfully",
//             group: result.rows[0]
//         });

//     } catch (err) {
//         console.error("Error creating group:", err);

//         res.status(500).json({
//             message: "Internal server error"
//         });
//     }
// };
const createGroup = async (req, res) => {
    try {
        const { name, description, avatar, isPrivate } = req.body;
        const createdBy = req.session.userId;

        if (!name) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        const groupId = uuidv4();

        await pool.query("BEGIN");

        // Create group
        const groupResult = await pool.query(
            `
            INSERT INTO study_groups (
                id,
                name,
                description,
                avatar,
                createdBy,
                isPrivate
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
            `,
            [
                groupId,
                name,
                description || null,
                avatar || null,
                createdBy,
                isPrivate || false
            ]
        );

        // Add creator as owner
        await pool.query(
            `
            INSERT INTO study_group_members (
                id,
                groupId,
                userId,
                role
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
                uuidv4(),
                groupId,
                createdBy,
                "owner"
            ]
        );

        await pool.query("COMMIT");

        res.status(201).json({
            message: "Group created successfully",
            group: groupResult.rows[0]
        });

    } catch (err) {
        await pool.query("ROLLBACK");

        console.error("Error creating group:", err);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};
module.exports = {
    createGroup
};

const getAllGroups = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM study_groups
            ORDER BY createdAt DESC
        `);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error getting all groups:", err);
        res.status(500).json({
            error: "Internal server error"
        });
    }
};
const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM study_groups WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error getting group by ID:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, avatar, isPrivate } = req.body;
        const now = new Date();

        const query = `
            UPDATE study_groups
            SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                avatar = COALESCE($3, avatar),
                isPrivate = COALESCE($4, isPrivate),
                updatedAt = $5
            WHERE id = $6
            RETURNING *;
        `;

        const values = [
            name,
            description,
            avatar,
            isPrivate,
            now,
            id
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Group not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error("Error updating group:", err);
        res.status(500).json({
            error: "Internal server error"
        });
    }
};

const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete
        const result = await pool.query( 'DELETE FROM study_groups WHERE id = $1 RETURNING *',
            [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.status(200).json({ message: "Group  deleted successfully" });
    } catch (err) {
        console.error("Error deleting group:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const searchGroups = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: "Search query is required" });
        }
        const query = `
            SELECT * FROM study_groups
            WHERE (name ILIKE $1 OR description ILIKE $1 ) 
            ORDER BY createdAt DESC;
        `;
        const result = await pool.query(query, [`%${q}%`]);
            if (result.rows.length === 0) {
        return res.status(404).json({
            message: "No notes found"
        });
}
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error searching notes:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createGroup,
    getAllGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    searchGroups
};