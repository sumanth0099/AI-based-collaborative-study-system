const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");
const socketManager = require("../socketManager");
const io = socketManager.getIO();
const { userSocketMap } = socketManager;

const postFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.session.userId;

    if (!requesterId || !recipientId) {
      return res.status(400).json({
        message: "Both requester and recipient IDs are required"
      });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({
        message: "Cannot send friend request to yourself"
      });
    }

    // Check requester
    const requesterResult = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [requesterId]
    );

    if (requesterResult.rows.length === 0) {
      return res.status(404).json({
        message: "Requester not found"
      });
    }

    const requesterName = requesterResult.rows[0].name;

    // Check existing pending request
    const existingRequest = await pool.query(
      `SELECT id
       FROM friend_requests
       WHERE senderId = $1
       AND receiverId = $2
       AND status = 'pending'`,
      [requesterId, recipientId]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({
        message: "Friend request already sent"
      });
    }

    // Create friend request
    await pool.query(
      `INSERT INTO friend_requests
       (id, senderId, receiverId, status, createdAt)
       VALUES ($1, $2, $3, 'pending', NOW())`,
      [createID(), requesterId, recipientId]
    );

    // Check if recipient is online
    const socketId = userSocketMap.get(String(recipientId));

    // Create notification
    await pool.query(
      `INSERT INTO notifications
       (id, receiverId, type, message, is_sent, createdAt)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        createID(),
        recipientId,
        "friend_request",
        `You have a new friend request from ${requesterName}`,
        Boolean(socketId)
      ]
    );

    // Realtime notification
    if (socketId) {
      io.to(socketId).emit("friend_request", {
        from: requesterName,
        requesterId
      });
    }

    return res.status(201).json({
      message: "Friend request sent successfully"
    });

  } catch (err) {
    console.error("postFriendRequest error:", err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

 


const handleFriendRequest = async (req, res) => {
      const { requestId, action } = req.body;
    
      if (!requestId || !action) {
        return res.status(400).json({ message: "requestId and action are required" });
      }
    
      try {
        // 1. Get friend request
        const reqResult = await pool.query(
          `SELECT * FROM friend_requests WHERE id = $1 AND status = 'pending'`,
          [requestId]
        );
    
        if (reqResult.rows.length === 0) {
          return res.status(404).json({ message: "Friend request not found" });
        }
    
        const { senderid, receiverid } = reqResult.rows[0];
    
        const senderSocket = userSocketMap.get(String(senderid));
    
        // ======================
        // ACCEPT REQUEST
        // ======================
        if (action === "accept") {
          await pool.query(
            `UPDATE friend_requests SET status = 'accepted' WHERE id = $1`,
            [requestId]
          );
    
          const [userOneId, userTwoId] = [senderid, receiverid].sort();
    
          await pool.query(
            `INSERT INTO friends (id, userOneId, userTwoId)
             VALUES ($1, $2, $3)`,
            [createID(), userOneId, userTwoId]
          );
    
          await pool.query(
            `INSERT INTO notifications (id, receiverId, type, message, is_sent, createdAt)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              createID(),
              senderid,
              "friend_request_accepted",
              "Your friend request was accepted",
              Boolean(senderSocket),
            ]
          );
    
          if (senderSocket) {
            io.to(senderSocket).emit("friend_request_accepted", {
              from: receiverid,
            });
          }
    
          return res.status(200).json({ message: "Friend request accepted" });
        }
    
        // ======================
        // REJECT REQUEST
        // ======================
        if (action === "reject") {
          await pool.query(
            `UPDATE friend_requests SET status = 'rejected' WHERE id = $1`,
            [requestId]
          );
    
          await pool.query(
            `INSERT INTO notifications (id, receiverId, type, message, is_sent, createdAt)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              createID(),
              senderid,
              "friend_request_rejected",
              "Your friend request was rejected",
              Boolean(senderSocket),
            ]
          );
    
          if (senderSocket) {
            io.to(senderSocket).emit("friend_request_rejected", {
              from: receiverid,
            });
          }
    
          return res.status(200).json({ message: "Friend request rejected" });
        }
    
        return res.status(400).json({ message: "Invalid action" });
    
      } catch (err) {
        console.error("handleFriendRequest error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
    };
    
  


    const getMyFrnds = async (req, res) => {
      try {
        const myid = req.session?.userId;
    
        if (!myid) {
          return res.status(401).json({
            message: "Unauthorized"
          });
        }
    
        const query = `
          SELECT
            u.id,
            u.name AS username,
            u.email,
            u.is_verified,
            f.createdAt AS joined_on
          FROM friends f
          JOIN users u
            ON u.id = f.userTwoId
          WHERE f.userOneId = $1
    
          UNION
    
          SELECT
            u.id,
            u.name AS username,
            u.email,
            u.is_verified,
            f.createdAt AS joined_on
          FROM friends f
          JOIN users u
            ON u.id = f.userOneId
          WHERE f.userTwoId = $1
        `;
    
        const result = await pool.query(query, [myid]);
    
        return res.status(200).json({
          success: true,
          count: result.rows.length,
          friends: result.rows
        });
    
      } catch (err) {
        console.error("getMyFrnds error:", err);
    
        return res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    };

module.exports = {
    getMyFrnds,
    postFriendRequest,
    handleFriendRequest
}