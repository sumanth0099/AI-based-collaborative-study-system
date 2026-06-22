const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");
const { io, userSocketMap } = require("../../server.js");

const postFriendRequest= async (req, res) => {
    const {requesterId, recipientId} = req.body;
    if(!requesterId || !recipientId) 
        return res.status(400).json({ message: "Both requester and recipient IDs are required" });
    if(requesterId === recipientId)
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
    const socketId = userSocketMap.get(recipientId);
    let requesterName = await pool.query(`SELECT name FROM users WHERE id = $1`, [requesterId]);
    if(requesterName.rows.length === 0)
        return res.status(404).json({ message: "Requester not found" });
    if(socketId){
            io.to(socketId).emit("friend_request", { from: requesterName.rows[0].name, requesterId });
            let noti_result = await pool.query(
                `INSERT INTO notifications (id, receiverId, type, message, is_sent, createdAt)
                 VALUES ($1, $2, $3, $4, TRUE, $5);`,
                [
                  createID(),
                  recipientId,
                  "friend_request",
                  `You have a new friend request from ${requesterName.rows[0].name}`,
                  new Date()
                ]
              );
            if(noti_result.rowCount === 0)
                return res.status(500).json({ message: "Failed to create notification" });
            let resultApplication = await pool.query(`INSERT INTO friend_requests (id, senderId, receiverId, status, createdAt) VALUES ($1, $2, $3, $4, NOW())`, [createID(), requesterId, recipientId, 'pending']);
            if(resultApplication.rowCount>0)
                res.status(201).json({ message: "Friend request sent" });
        }
    else{
        let resultApplication = await pool.query(`INSERT INTO friend_requests (id, senderId, receiverId, status, createdAt) VALUES ($1, $2, $3, $4, NOW())`, [createID(), requesterId, recipientId, 'pending']);
        if(resultApplication.rowCount>0)
            res.status(201).json({ message: "Friend request sent" });
         else
            res.status(500).json({ message: "Failed to send friend request" });
            let noti_result = await pool.query(
                `INSERT INTO notifications (id, receiverId, type, message, is_sent, createdAt)
                 VALUES ($1, $2, $3, $4, FALSE, $5)`,
                [
                  createID(),
                  recipientId,
                  "friend_request",
                  `You have a new friend request from ${requesterName.rows[0].name}`,
                  new Date()
                ]
              );
                if(noti_result.rowCount === 0)
                    console.error("Failed to create notification for offline user");
        }

    }

 


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
    
    module.exports = {
      handleFriendRequest,
    };



const getMyFrnds = async (req,res)=>{
    let myid = req.params.userId;
    const query = `SELECT 
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
                        u.name AS username,
                        u.email,
                        u.is_verified,
                        f.createdAt AS joined_on
                    FROM friends f
                    JOIN users u 
                    ON u.id = f.userOneId
                    WHERE f.userTwoId = $1;`;
        const result =await pool.query(query, [myid]);
        if(result.rowCount>0)
            res.status(200).json(result.rows);
        else
            res.status(404).json({ message: "No friends found" });
}   
module.exports = {
    getMyFrnds,
    postFriendRequest,
    handleFriendRequest
}