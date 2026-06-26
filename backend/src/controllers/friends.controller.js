const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");
const socketManager = require("../socketManager");
// const { json } = require("express");
// const io = socketManager.getIO(); // Removed initialization; will fetch dynamically
const { userSocketMap } = socketManager;


const getMyReceivedRequests = async (req, res) => {
  try {
    const myid = req.session?.userId;

    if (!myid) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const query = `
      SELECT fr.id AS request_id, u.id AS sender_id, u.name AS sender_name, fr.status, fr.createdAt
      FROM friend_requests fr
      JOIN users u ON fr.senderId = u.id
      WHERE fr.receiverId = $1 AND fr.status = 'pending'
    `;

    const result = await pool.query(query, [myid]);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      requests: result.rows
    });

  } catch (err) {
    console.error("getMyRequests error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
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
        false
      ]
    );

    // Realtime notification
    if (socketId) {
      socketManager.getIO().to(socketId).emit("friend_request", {
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
              false,
            ]
          );
    
          if (senderSocket) {
            socketManager.getIO().to(senderSocket).emit("friend_request_accepted", {
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
              false,
            ]
          );
    
          if (senderSocket) {
            socketManager.getIO().to(senderSocket).emit("friend_request_rejected", {
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

    const getAllUsers = async (req, res) => {
      try {
        const myid = req.session?.userId;
    
        if (!myid) {
          return res.status(401).json({
            message: "Unauthorized"
          });
        }
    
        const query = `
          SELECT id, name, email, is_verified, created_at AS "createdAt", avatar
          FROM users
          WHERE id != $1
        `;

        const result = await pool.query(query, [myid]);
        if(result.rows.length === 0){
          return res.status(404).json({
            success: false,
            message: "No other users found"
          });
        }
        return res.status(200).json({
          success: true,
          count: result.rows.length,
          users: result.rows
        });
    
      } catch (err) {
        console.error("getAllUsers error:", err);
    
        return res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
    const searchUsers = async (req, res) => {
      try {
        const myId = req.session?.userId;
    
        if (!myId) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized"
          });
        }
    
        const username = req.query.username?.trim();
    
        if (!username) {
          return res.status(400).json({
            success: false,
            message: "Username is required"
          });
        }
    
        const limit = 10;
        const offset = Number(req.query.offset) || 0;
    
        const result = await pool.query(
          `
          SELECT
            id,
            name,
            email,
            is_verified,
            avatar,
            created_at AS "createdAt"
          FROM users
          WHERE id != $1
            AND name ILIKE $2
          ORDER BY name
          LIMIT $3
          OFFSET $4
          `,
          [myId, `%${username}%`, limit, offset]
        );
    
        return res.status(200).json({
          success: true,
          count: result.rows.length,
          limit,
          offset,
          users: result.rows
        });
    
      } catch (error) {
        console.error(error);
    
        return res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    };
module.exports = {
    getMyFrnds,
    postFriendRequest,
    handleFriendRequest,
    getMyReceivedRequests,
    getAllUsers,
    searchUsers
}