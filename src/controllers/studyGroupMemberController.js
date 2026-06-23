// const pool = require("../config");
// const { v4: uuidv4 } = require("uuid");

// const joinGroup = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const userId = req.session.userId;

//         // Check whether group exists
//         const groupResult = await pool.query(
//             `SELECT * FROM study_groups WHERE id = $1`,
//             [groupId]
//         );

//         if (groupResult.rows.length === 0) {
//             return res.status(404).json({
//                 error: "Group not found"
//             });
//         }

//         // Check whether already a member
//         const memberResult = await pool.query(
//             `
//             SELECT *
//             FROM study_group_members
//             WHERE groupId = $1
//             AND userId = $2
//             `,
//             [groupId, userId]
//         );

//         if (memberResult.rows.length > 0) {
//             return res.status(400).json({
//                 error: "Already a member of this group"
//             });
//         }

//         // Add member
//         await pool.query(
//             `
//             INSERT INTO study_group_members
//             (id, groupId, userId, role)
//             VALUES ($1, $2, $3, $4)
//             `,
//             [
//                 uuidv4(),
//                 groupId,
//                 userId,
//                 "member"
//             ]
//         );

//         res.status(201).json({
//             message: "Joined group successfully"
//         });

//     } catch (err) {
//         console.error("Error joining group:", err);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// };

// const leaveGroup = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const userId = req.session.userId;

//         // Check membership and role
//         const memberResult = await pool.query(
//             `
//             SELECT role
//             FROM study_group_members
//             WHERE groupId = $1
//             AND userId = $2
//             `,
//             [groupId, userId]
//         );

//         if (memberResult.rows.length === 0) {
//             return res.status(404).json({
//                 error: "You are not a member of this group"
//             });
//         }

//         const role = memberResult.rows[0].role;

//         // If admin leaves, delete the whole group
//         if (role === "admin") {

//             await pool.query(
//                 `
//                 DELETE FROM study_groups
//                 WHERE id = $1
//                 `,
//                 [groupId]
//             );

//             return res.status(200).json({
//                 message: "Admin left the group. Group deleted successfully."
//             });
//         }

//         // Normal member leaves
//         await pool.query(
//             `
//             DELETE FROM study_group_members
//             WHERE groupId = $1
//             AND userId = $2
//             `,
//             [groupId, userId]
//         );

//         res.status(200).json({
//             message: "Left group successfully"
//         });

//     } catch (err) {
//         console.error("Error leaving group:", err);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// };

// const getGroupMembers = async (req, res) => {
//     try {
//         const { groupId } = req.params;

//         // Check if group exists
//         const groupResult = await pool.query(
//             `
//             SELECT *
//             FROM study_groups
//             WHERE id = $1
//             `,
//             [groupId]
//         );

//         if (groupResult.rows.length === 0) {
//             return res.status(404).json({
//                 error: "Group not found"
//             });
//         }

//         // Fetch members
//         const result = await pool.query(
//             `
//             SELECT
//                 u.id,
//                 u.name,
//                 u.email,
//                 u.avatar,
//                 sgm.role,
//                 sgm.joinedAt
//             FROM study_group_members sgm
//             JOIN users u
//             ON sgm.userId = u.id
//             WHERE sgm.groupId = $1
//             ORDER BY
//                 CASE
//                     WHEN sgm.role = 'admin' THEN 1
//                     ELSE 2
//                 END,
//                 sgm.joinedAt;
//             `,
//             [groupId]
//         );

//         res.status(200).json({
//             totalMembers: result.rows.length,
//             members: result.rows
//         });

//     } catch (err) {
//         console.error("Error getting group members:", err);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// };
// const promoteMember = async (req, res) => {
//     try {
//         const { groupId, userId } = req.params;
//         const currentUserId = req.session.userId;

//         // Check if current user is an admin
//         const adminResult = await pool.query(
//             `
//             SELECT role
//             FROM study_group_members
//             WHERE groupId = $1
//             AND userId = $2
//             `,
//             [groupId, currentUserId]
//         );

//         if (adminResult.rows.length === 0) {
//             return res.status(403).json({
//                 error: "You are not a member of this group"
//             });
//         }

//         if (adminResult.rows[0].role !== "admin") {
//             return res.status(403).json({
//                 error: "Only admins can promote members"
//             });
//         }

//         // Check target user exists in group
//         const memberResult = await pool.query(
//             `
//             SELECT role
//             FROM study_group_members
//             WHERE groupId = $1
//             AND userId = $2
//             `,
//             [groupId, userId]
//         );

//         if (memberResult.rows.length === 0) {
//             return res.status(404).json({
//                 error: "User is not a member of this group"
//             });
//         }

//         if (memberResult.rows[0].role === "admin") {
//             return res.status(400).json({
//                 error: "User is already an admin"
//             });
//         }

//         // Promote
//         await pool.query(
//             `
//             UPDATE study_group_members
//             SET role = 'admin'
//             WHERE groupId = $1
//             AND userId = $2
//             `,
//             [groupId, userId]
//         );

//         res.status(200).json({
//             message: "Member promoted to admin successfully"
//         });

//     } catch (err) {
//         console.error("Error promoting member:", err);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// };
// const getMyGroups = async (req, res) => {
//     try {
//         const userId = req.session.userId;

//         const result = await pool.query(
//             `
//             SELECT
//                 sg.id,
//                 sg.name,
//                 sg.description,
//                 sg.avatar,
//                 sg.createdBy,
//                 sg.isPrivate,
//                 sg.createdAt,
//                 sg.updatedAt,
//                 sgm.role
//             FROM study_group_members sgm
//             JOIN study_groups sg
//             ON sgm.groupId = sg.id
//             WHERE sgm.userId = $1
//             ORDER BY sg.createdAt DESC
//             `,
//             [userId]
//         );

//         res.status(200).json({
//             totalGroups: result.rows.length,
//             groups: result.rows
//         });

//     } catch (err) {
//         console.error("Error fetching groups:", err);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// };

// module.exports = {
//     joinGroup,
//     leaveGroup,
//     getGroupMembers,
//     promoteMember,
//     getMyGroups
// };

const pool = require("../config");
const { v4: uuidv4 } = require("uuid");

// Join Group
const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.session.userId;

        // Check whether group exists
        const groupResult = await pool.query(
            `SELECT * FROM study_groups WHERE id = $1`,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({
                error: "Group not found"
            });
        }

        // Check whether already a member
        const memberResult = await pool.query(
            `
            SELECT *
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        if (memberResult.rows.length > 0) {
            return res.status(400).json({
                error: "Already a member of this group"
            });
        }

        // Add member
        await pool.query(
            `
            INSERT INTO study_group_members
            (id, groupId, userId, role)
            VALUES ($1, $2, $3, $4)
            `,
            [
                uuidv4(),
                groupId,
                userId,
                "member"
            ]
        );

        res.status(201).json({
            message: "Joined group successfully"
        });

    } catch (err) {
        console.error("Error joining group:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Leave Group
const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.session.userId;

        const memberResult = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        if (memberResult.rows.length === 0) {
            return res.status(404).json({
                error: "You are not a member of this group"
            });
        }

        const role = memberResult.rows[0].role;

        // Owner leaves -> delete group
        if (role === "owner") {
            await pool.query(
                `
                DELETE FROM study_groups
                WHERE id = $1
                `,
                [groupId]
            );

            return res.status(200).json({
                message: "Owner left. Group deleted successfully."
            });
        }

        // Admin/member leaves
        await pool.query(
            `
            DELETE FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        res.status(200).json({
            message: "Left group successfully"
        });

    } catch (err) {
        console.error("Error leaving group:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Get Group Members
const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        const groupResult = await pool.query(
            `
            SELECT *
            FROM study_groups
            WHERE id = $1
            `,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({
                error: "Group not found"
            });
        }

        const result = await pool.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.avatar,
                sgm.role,
                sgm.joinedAt
            FROM study_group_members sgm
            JOIN users u
            ON sgm.userId = u.id
            WHERE sgm.groupId = $1
            ORDER BY
                CASE
                    WHEN sgm.role = 'owner' THEN 1
                    WHEN sgm.role = 'admin' THEN 2
                    ELSE 3
                END,
                sgm.joinedAt
            `,
            [groupId]
        );

        res.status(200).json({
            totalMembers: result.rows.length,
            members: result.rows
        });

    } catch (err) {
        console.error("Error getting members:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Promote Member -> Admin (Owner only)
const promoteMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const currentUserId = req.session.userId;

        const currentUser = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, currentUserId]
        );

        if (
            currentUser.rows.length === 0 ||
            currentUser.rows[0].role !== "owner"
        ) {
            return res.status(403).json({
                error: "Only owner can promote members"
            });
        }

        const targetUser = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        if (targetUser.rows.length === 0) {
            return res.status(404).json({
                error: "User is not a member"
            });
        }

        if (targetUser.rows[0].role !== "member") {
            return res.status(400).json({
                error: "Only members can be promoted"
            });
        }

        await pool.query(
            `
            UPDATE study_group_members
            SET role = 'admin'
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        res.status(200).json({
            message: "Member promoted to admin successfully"
        });

    } catch (err) {
        console.error("Error promoting member:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Demote Admin -> Member (Owner only)
const demoteAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const currentUserId = req.session.userId;

        const currentUser = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, currentUserId]
        );

        if (
            currentUser.rows.length === 0 ||
            currentUser.rows[0].role !== "owner"
        ) {
            return res.status(403).json({
                error: "Only owner can demote admins"
            });
        }

        const targetUser = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        if (
            targetUser.rows.length === 0 ||
            targetUser.rows[0].role !== "admin"
        ) {
            return res.status(400).json({
                error: "User is not an admin"
            });
        }

        await pool.query(
            `
            UPDATE study_group_members
            SET role = 'member'
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        res.status(200).json({
            message: "Admin demoted successfully"
        });

    } catch (err) {
        console.error("Error demoting admin:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Remove Member/Admin
const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const currentUserId = req.session.userId;

        const currentUser = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, currentUserId]
        );

        if (currentUser.rows.length === 0) {
            return res.status(403).json({
                error: "You are not a member"
            });
        }

        const currentRole = currentUser.rows[0].role;

        const targetUser = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        if (targetUser.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const targetRole = targetUser.rows[0].role;

        // Cannot remove owner
        if (targetRole === "owner") {
            return res.status(403).json({
                error: "Owner cannot be removed"
            });
        }

        // Member cannot remove anyone
        if (currentRole === "member") {
            return res.status(403).json({
                error: "Permission denied"
            });
        }

        // Admin can remove only members
        if (
            currentRole === "admin" &&
            targetRole !== "member"
        ) {
            return res.status(403).json({
                error: "Admins can remove only members"
            });
        }

        await pool.query(
            `
            DELETE FROM study_group_members
            WHERE groupId = $1
            AND userId = $2
            `,
            [groupId, userId]
        );

        res.status(200).json({
            message: "User removed successfully"
        });

    } catch (err) {
        console.error("Error removing member:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Get My Groups
const getMyGroups = async (req, res) => {
    try {
        const userId = req.session.userId;

        const result = await pool.query(
            `
            SELECT
                sg.id,
                sg.name,
                sg.description,
                sg.avatar,
                sg.createdBy,
                sg.isPrivate,
                sg.createdAt,
                sg.updatedAt,
                sgm.role
            FROM study_group_members sgm
            JOIN study_groups sg
            ON sgm.groupId = sg.id
            WHERE sgm.userId = $1
            ORDER BY sg.createdAt DESC
            `,
            [userId]
        );

        res.status(200).json({
            totalGroups: result.rows.length,
            groups: result.rows
        });

    } catch (err) {
        console.error("Error fetching groups:", err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

module.exports = {
    joinGroup,
    leaveGroup,
    getGroupMembers,
    promoteMember,
    demoteAdmin,
    removeMember,
    getMyGroups
};