const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");
const postFriendRequest= async (req, res) => {
    const {requesterId, recipientId} = req.body;
    if(!requesterId || !recipientId) 
        return res.status(400).json({ message: "Both requester and recipient IDs are required" });
    if(requesterId === recipientId)
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
    
}
const  postFriends = async (req, res) => {
    const {userOneId, userTwoId} = req.body;
    if(!userOneId || !userTwoId) {
        return res.status(400).json({ message: "Both user IDs are required" });
    }
    if(userOneId === userTwoId) 
        return res.status(400).json({ message: "Cannot be friends with yourself" });
   const checkRes = await pool.query(`SELECT * FROM FRIENDS WHERE (userOneId = $1 AND userTwoId = $2) OR (userOneId = $2 AND userTwoId = $1)`, [userOneId, userTwoId])
   if(checkRes.rows.length > 0) 
     return res.json({ message: "Friendship already exists" });
    const query = `INSERT INTO FRIENDS (id, userOneId, userTwoId) VALUES ($1, $2, $3) RETURNING *`;
    try {
        const result = await pool.query(query, [createID(), userOneId, userTwoId]);
        if(result.rowCount>0)
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error inserting friend:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
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
    postFriends
}