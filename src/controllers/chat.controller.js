const createID = require("../utils/generateuuid.js");
const pool = require("../config.js");
const socketManager = require("../socketManager");
// const { json } = require("express");
const io = socketManager.getIO();
const { userSocketMap } = socketManager;

const chatWithUser = async (req, res) => {
    const receiverId = req.params.userId;
    const senderId = req.session.userId;
    if(!senderId){
        return res.status(401).json({message:"Unauthorized"});
    }
    if(senderId === receiverId){
        return res.status(400).json({message:"Cannot chat with yourself"});
    }
    if(!receiverId){
        return res.status(400).json({message:"Receiver ID is required"});
    }
    
    const socketId = userSocketMap.get(receiverId);
    if(socketId){
        io.to(socketId).emit("new_message", {
            from: senderId,
            message: "You have a new message!"
        });
    }
}