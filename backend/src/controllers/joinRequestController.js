const pool = require("../config");
const { v4: uuidv4 } = require("uuid");

// Send Join Request
const sendJoinRequest = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.session.userId;

        // Check if already a member
        const memberResult = await pool.query(
            `
            SELECT *
            FROM study_group_members
            WHERE groupid = $1
            AND userid = $2
            `,
            [groupId, userId]
        );

        if (memberResult.rows.length > 0) {
            return res.status(400).json({
                error: "Already a member"
            });
        }
        if (groupResult.rows[0].visibility !== "private") {
    return res.status(400).json({
        error: "Public groups can be joined directly"
    });
}

        // Check if request already exists
        const requestResult = await pool.query(
            `
            SELECT *
            FROM group_join_requests
            WHERE groupid = $1
            AND userid = $2
            `,
            [groupId, userId]
        );

        if (requestResult.rows.length > 0) {
            return res.status(400).json({
                error: "Join request already sent"
            });
        }

        await pool.query(
            `
            INSERT INTO group_join_requests
            (id, groupid, userid)
            VALUES ($1, $2, $3)
            `,
            [uuidv4(), groupId, userId]
        );

        res.status(201).json({
            message: "Join request sent successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};


// Get Pending Requests
const getPendingRequests = async (req, res) => {
    try {
        const { groupId } = req.params;

        const result = await pool.query(
            `
            SELECT
                gjr.*,
                u.name,
                u.email
            FROM group_join_requests gjr
            JOIN users u
            ON gjr.userid = u.id
            WHERE gjr.groupid = $1
            AND gjr.status = 'pending'
            `,
            [groupId]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};


// Approve Request
const approveRequest = async (req, res) => {
    const client = await pool.connect();

    try {
        const { groupId, userId } = req.params;
        const reviewerId = req.session.userId;

        await client.query("BEGIN");

        await client.query(
            `
            INSERT INTO study_group_members
            (id, groupid, userid, role)
            VALUES ($1, $2, $3, 'member')
            `,
            [uuidv4(), groupId, userId]
        );

        await client.query(
            `
            UPDATE group_join_requests
            SET status = 'approved',
                reviewedby = $1,
                reviewedat = CURRENT_TIMESTAMP
            WHERE groupid = $2
            AND userid = $3
            `,
            [reviewerId, groupId, userId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Request approved successfully"
        });

    } catch (err) {
        await client.query("ROLLBACK");

        console.error(err);

        res.status(500).json({
            error: "Internal server error"
        });

    } finally {
        client.release();
    }
};


// Reject Request
const rejectRequest = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const reviewerId = req.session.userId;

        await pool.query(
            `
            UPDATE group_join_requests
            SET status = 'rejected',
                reviewedby = $1,
                reviewedat = CURRENT_TIMESTAMP
            WHERE groupid = $2
            AND userid = $3
            `,
            [reviewerId, groupId, userId]
        );

        res.status(200).json({
            message: "Request rejected successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Internal server error"
        });
    }
};

module.exports = {
    sendJoinRequest,
    getPendingRequests,
    approveRequest,
    rejectRequest
};