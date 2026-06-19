const { uploadToCloudinary } = require('../utils/cloudinary.js');

const uploadResource = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        
        res.status(200).json({ 
            message: "Resource uploaded successfully",
            data: {
                cloudinaryUrl: result.secure_url,
                cloudinaryPublicId: result.public_id,
                originalFileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            }
        });
    } catch (err) {
        console.error("Error uploading resource:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const shareResource = async (req, res) => {
    try {
        const { resourceId, sharedWithUserId } = req.body;
        
        console.log(`Sharing resource ${resourceId} with user ${sharedWithUserId}`);
        
        res.status(200).json({ 
            message: "Resource shared successfully (placeholder)",
            data: { resourceId, sharedWithUserId }
        });
    } catch (err) {
        console.error("Error sharing resource:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};



module.exports = {
    uploadResource,
    shareResource,
    
};
