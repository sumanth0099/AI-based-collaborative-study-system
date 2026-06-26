const pool = require("../config");

const isGroupOwner = async (req, res, next) => {
    try {
        const groupId = req.params.id || req.params.groupId;
        const userId = req.session.userId;

        const result = await pool.query(
            `
            SELECT role
            FROM study_group_members
            WHERE groupid = $1 AND userid = $2
            `,
            [groupId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        if (result.rows[0].role !== "owner") {
            return res.status(403).json({
                message: "Only owner can perform this action"
            });
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = isGroupOwner;