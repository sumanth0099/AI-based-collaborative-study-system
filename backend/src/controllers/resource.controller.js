// const { uploadToCloudinary } = require('../utils/cloudinary.js');

// const uploadResource = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No file provided" });
//         }

//         // Upload to Cloudinary
//         const result = await uploadToCloudinary(req.file.buffer);
        
//         res.status(200).json({ 
//             message: "Resource uploaded successfully",
//             data: {
//                 cloudinaryUrl: result.secure_url,
//                 cloudinaryPublicId: result.public_id,
//                 originalFileName: req.file.originalname,
//                 fileSize: req.file.size,
//                 mimeType: req.file.mimetype
//             }
//         });
//     } catch (err) {
//         console.error("Error uploading resource:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

// const shareResource = async (req, res) => {
//     try {
//         const { resourceId, sharedWithUserId } = req.body;
        
//         console.log(`Sharing resource ${resourceId} with user ${sharedWithUserId}`);
        
//         res.status(200).json({ 
//             message: "Resource shared successfully (placeholder)",
//             data: { resourceId, sharedWithUserId }
//         });
//     } catch (err) {
//         console.error("Error sharing resource:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };



// module.exports = {
//     uploadResource,
//     shareResource,
    
// };
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

/**
 * ---------------------------
 * CLOUDINARY CONFIG
 * ---------------------------
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * ---------------------------
 * TEMP STORAGE (replace with DB later)
 * ---------------------------
 */
let resources = [];

/**
 * ---------------------------
 * CLOUDINARY HELPERS
 * ---------------------------
 */
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "resources",
                resource_type: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(fileBuffer);
    });
};

const deleteFromCloudinary = (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

/**
 * ---------------------------
 * UPLOAD RESOURCE
 * ---------------------------
 */
const uploadResource = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        const newResource = {
            id: Date.now().toString(),
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
            originalFileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            createdAt: new Date()
        };

        resources.push(newResource);

        return res.status(200).json({
            message: "Resource uploaded successfully",
            data: newResource
        });

    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ---------------------------
 * LIST RESOURCES
 * ---------------------------
 */
const listResources = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Resources fetched successfully",
            data: resources
        });
    } catch (err) {
        console.error("List error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ---------------------------
 * GET SINGLE RESOURCE
 * ---------------------------
 */
const getResource = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = resources.find(r => r.id === id);

        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }

        return res.status(200).json({
            message: "Resource fetched successfully",
            data: resource
        });

    } catch (err) {
        console.error("Get error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ---------------------------
 * DELETE RESOURCE
 * ---------------------------
 */
const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        const index = resources.findIndex(r => r.id === id);

        if (index === -1) {
            return res.status(404).json({ error: "Resource not found" });
        }

        const resource = resources[index];

        // delete from cloudinary
        await deleteFromCloudinary(resource.cloudinaryPublicId);

        resources.splice(index, 1);

        return res.status(200).json({
            message: "Resource deleted successfully",
            data: resource
        });

    } catch (err) {
        console.error("Delete error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ---------------------------
 * SHARE RESOURCE (basic placeholder)
 * ---------------------------
 */
const shareResource = async (req, res) => {
    try {
        const { resourceId, sharedWithUserId } = req.body;

        const resource = resources.find(r => r.id === resourceId);

        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }

        resource.sharedWith = resource.sharedWith || [];
        resource.sharedWith.push(sharedWithUserId);

        return res.status(200).json({
            message: "Resource shared successfully",
            data: {
                resourceId,
                sharedWithUserId
            }
        });

    } catch (err) {
        console.error("Share error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ---------------------------
 * EXPORTS
 * ---------------------------
 */
module.exports = {
    uploadResource,
    listResources,
    getResource,
    deleteResource,
    shareResource
};