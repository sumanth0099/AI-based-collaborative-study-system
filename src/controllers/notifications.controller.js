const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");
const socketManager = require("../socketManager");
const io = socketManager.getIO();
const { userSocketMap } = socketManager;

const getMyNotificationHistory = async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const query = `
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        const notifications = result.rows;
        await pool.query(
            `
            UPDATE notifications
            SET is_sent = true
            WHERE user_id = $1
              AND is_sent = false
            `,
            [userId]
          );
        return res.status(200).json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
const getNewNotification = async (req, res) => {
    try {
      const userId = req.session?.userId;
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
  
      const result = await pool.query(
        `
        SELECT *
        FROM notifications
        WHERE user_id = $1
          AND is_sent = false
        ORDER BY created_at DESC
        `,
        [userId]
      );
  
      const notifications = result.rows;
  
      if (notifications.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          notifications: []
        });
      }
  
      await pool.query(
        `
        UPDATE notifications
        SET is_sent = true
        WHERE user_id = $1
          AND is_sent = false
        `,
        [userId]
      );
  
      return res.status(200).json({
        success: true,
        count: notifications.length,
        notifications
      });
      
  
    } catch (error) {
      console.error("getNewNotification:", error);
  
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
  const markNotificationsSeen = async(req,res)=>{
  try{

    const userId = req.session.userId;

    await pool.query(
      `
      UPDATE notifications
      SET is_seen = true
      WHERE receiverId = $1
      AND is_seen = false
      `,
      [userId]
    );

    return res.status(200).json({
      success:true,
      message:"Notifications marked as seen"
    });

  }catch(err){
    console.log(err);

    return res.status(500).json({
      success:false,
      message:"Internal server error"
    });
  }
};
module.exports = {
    getMyNotificationHistory,
    getNewNotification,
    
}