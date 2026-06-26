const pool = require("../config");
const { v4: uuidv4 } = require("uuid");

// Send Join Request
const sendJoinRequest = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.session.userId;

        // Fetch group to check privacy
        const groupResult = await pool.query('SELECT isPrivate FROM study_groups WHERE id = $1', [groupId]);
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: "Group not found" });
        }

        const group = groupResult.rows[0];

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
        
        if (!group.isprivate) {
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
            const status = requestResult.rows[0].status;
            if (status === 'pending') {
                return res.status(400).json({
                    error: "Join request already sent and is pending"
                });
            }
            if (status === 'approved') {
                // If the user is currently NOT a member, allow them to re-request
                // This handles cases where they were approved, joined, then LEFT.
                const actuallyMember = await pool.query(
                    "SELECT 1 FROM study_group_members WHERE groupid = $1 AND userid = $2",
                    [groupId, userId]
                );
                
                if (actuallyMember.rowCount === 0) {
                    await pool.query(
                        "DELETE FROM group_join_requests WHERE groupid = $1 AND userid = $2",
                        [groupId, userId]
                    );
                    // Old approved request removed, proceed to insert a new pending one below
                } else {
                    return res.status(400).json({
                        error: "You are already a member"
                    });
                }
            }
            // If rejected, remove old one so a new one can be inserted
            if (status === 'rejected') {
                await pool.query(
                    "DELETE FROM group_join_requests WHERE groupid = $1 AND userid = $2",
                    [groupId, userId]
                );
            }
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
        const userId = req.session.userId;

        console.log(`[DEBUG] getPendingRequests: groupId=${groupId}, userId=${userId}`);

        // Verify requesting user is owner or admin
        const memberResult = await pool.query(
            "SELECT role FROM study_group_members WHERE groupid = $1 AND userid = $2",
            [groupId, userId]
        );

        console.log(`[DEBUG] Member check result rows:`, memberResult.rows);

        if (memberResult.rows.length === 0 || (memberResult.rows[0].role !== 'owner' && memberResult.rows[0].role !== 'admin')) {
            console.log(`[DEBUG] Security check failed for user ${userId}`);
            return res.status(403).json({ error: "Only owners and admins can view join requests" });
        }

        const result = await pool.query(
            `
            SELECT
                gjr.id,
                gjr.groupid AS "groupId",
                gjr.userid AS "userId",
                gjr.status,
                gjr.requestedat AS "createdAt",
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
        console.log(`[DEBUG] Found ${result.rows.length} pending requests`);

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

        // Verify reviewer is owner or admin
        const reviewerResult = await pool.query(
            "SELECT role FROM study_group_members WHERE groupid = $1 AND userid = $2",
            [groupId, reviewerId]
        );

        if (reviewerResult.rows.length === 0 || (reviewerResult.rows[0].role !== 'owner' && reviewerResult.rows[0].role !== 'admin')) {
            return res.status(403).json({ error: "Only owners and admins can approve requests" });
        }

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

        // Verify reviewer is owner or admin
        const reviewerResult = await pool.query(
            "SELECT role FROM study_group_members WHERE groupid = $1 AND userid = $2",
            [groupId, reviewerId]
        );

        if (reviewerResult.rows.length === 0 || (reviewerResult.rows[0].role !== 'owner' && reviewerResult.rows[0].role !== 'admin')) {
            return res.status(403).json({ error: "Only owners and admins can reject requests" });
        }

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