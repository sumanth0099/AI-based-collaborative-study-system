const pool = require("../config");

const isGroupAdmin = async (req, res, next) => {
    try {
        const groupId = req.params.id || req.params.groupId;
        const userId = req.session.userId;

        const result = await pool.query(
            "SELECT createdBy FROM study_groups WHERE id = $1",
            [groupId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (result.rows[0].createdby !== userId) {
            return res.status(403).json({
                message: "Only admin can perform this action"
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

module.exports = isGroupAdmin;