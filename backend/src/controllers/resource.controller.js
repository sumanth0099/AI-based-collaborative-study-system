const cloudinary = require("cloudinary").v2;
const pool = require("../config.js");
const createID = require("../utils/generateuuid.js");
// require("dotenv").config(); // Removed redundant call - already handled in server.js/config.js

/**
 * ---------------------------
 * CLOUDINARY CONFIG
 * ---------------------------
 */
// Validate Cloudinary configuration at load time
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Cloudinary configuration missing! Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in .env");
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * ---------------------------
 * CLOUDINARY HELPERS
 * ---------------------------
 */
const uploadToCloudinary = (fileBuffer, originalName = '') => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_API_KEY) {
            return reject(new Error("Cloudinary API key is not configured"));
        }

        const timestamp = Date.now();
        const extension = originalName.includes('.') ? '.' + originalName.split('.').pop().toLowerCase() : '';
        const nameWithoutExt = originalName.includes('.') ? originalName.split('.').slice(0, -1).join('.') : originalName;
        const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(originalName);
        const resourceType = isImage ? "image" : "raw";

        // For raw files, the extension MUST be in the public_id for Cloudinary to serve correct Content-Type
        const finalPublicId = isImage ? `${cleanName}_${timestamp}` : `${cleanName}_${timestamp}${extension}`;

        const uploadOptions = {
            folder: "resources",
            resource_type: resourceType,
            public_id: finalPublicId,
            access_mode: 'public'
        };

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result);
        });

        stream.end(fileBuffer);
    });
};

const deleteFromCloudinary = (publicId, resourceType = 'image') => {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
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

        const userId = req.session ? req.session.userId : null;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        const resourceId = createID();

        await pool.query(`
            INSERT INTO notes
            (id, userid, createdby, contenttype, originalfilename, cloudinarypublicid, cloudinaryurl, filesize, mimetype, createdat, updatedat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
            resourceId,
            userId,
            userId,
            'file',
            req.file.originalname,
            result.public_id,
            result.secure_url,
            req.file.size,
            req.file.mimetype,
            new Date(),
            new Date()
        ]);

        const newResource = {
            id: resourceId,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
            originalFileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            createdAt: new Date()
        };

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
        const userId = req.session ? req.session.userId : null;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Fetch resources uploaded by user OR shared with them
        const result = await pool.query(`
            SELECT DISTINCT 
                n.id, 
                n.originalfilename AS "originalFileName", 
                n.filesize AS "fileSize", 
                n.mimetype AS "mimeType", 
                n.cloudinaryurl AS "cloudinaryUrl", 
                n.cloudinarypublicid AS "cloudinaryPublicId", 
                n.createdat AS "createdAt",
                n.createdby = $1 AS "isOwner"
            FROM notes n
            LEFT JOIN note_shares ns ON n.id = ns.noteid
            WHERE (n.userid = $1 OR n.createdby = $1 OR ns.sharedwithuserid = $1)
              AND n.contenttype = 'file'
              AND (n.isarchived IS NULL OR n.isarchived = FALSE)
            ORDER BY n.createdat DESC
        `, [userId]);

        return res.status(200).json({
            message: "Resources fetched successfully",
            data: result.rows
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
        const userId = req.session ? req.session.userId : null;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(`
            SELECT n.id, n.originalfilename AS "originalFileName", n.filesize AS "fileSize", n.mimetype AS "mimeType", n.cloudinaryurl AS "cloudinaryUrl", n.cloudinarypublicid AS "cloudinaryPublicId", n.createdat AS "createdAt"
            FROM notes n
            LEFT JOIN note_shares ns ON n.id = ns.noteid
            WHERE n.id = $1 
              AND (n.userid = $2 OR n.createdby = $2 OR ns.sharedwithuserid = $2) 
              AND n.contenttype = 'file' 
              AND (n.isarchived IS NULL OR n.isarchived = FALSE)
            LIMIT 1
        `, [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Resource not found or access denied" });
        }

        return res.status(200).json({
            message: "Resource fetched successfully",
            data: result.rows[0]
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
        const userId = req.session ? req.session.userId : null;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(`
            SELECT id, cloudinarypublicid AS "cloudinaryPublicId", mimetype AS "mimeType"
            FROM notes
            WHERE id = $1 AND createdby = $2 AND contenttype = 'file'
        `, [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Resource not found or unauthorized to delete" });
        }

        const resource = result.rows[0];

        // delete from cloudinary
        if (resource.cloudinaryPublicId) {
            const isImage = resource.mimeType && resource.mimeType.startsWith('image/');
            await deleteFromCloudinary(resource.cloudinaryPublicId, isImage ? 'image' : 'raw');
        }

        await pool.query(`DELETE FROM notes WHERE id = $1`, [id]);

        return res.status(200).json({
            message: "Resource deleted successfully"
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
        const ownerId = req.session.userId;

        if (!resourceId || !sharedWithUserId) {
            return res.status(400).json({ error: "Resource ID and User ID are required" });
        }

        // Check if user owns the resource
        const resourceCheck = await pool.query(
            `SELECT originalfilename FROM notes WHERE id = $1 AND createdby = $2`,
            [resourceId, ownerId]
        );

        if (resourceCheck.rowCount === 0) {
            return res.status(403).json({ error: "Unauthorized or resource not found" });
        }

        const fileName = resourceCheck.rows[0].originalfilename;

        // Share the resource
        await pool.query(
            `INSERT INTO note_shares (id, noteid, sharedwithuserid)
             VALUES ($1, $2, $3)
             ON CONFLICT (noteid, sharedwithuserid) DO NOTHING`,
            [createID(), resourceId, sharedWithUserId]
        );

        // Notify the user
        await pool.query(
            `INSERT INTO notifications (id, receiverid, type, message, is_sent, createdat)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                createID(),
                sharedWithUserId,
                "resource_share",
                `A resource "${fileName}" was shared with you by ${req.session.username || 'a user'}.`,
                false,
                new Date()
            ]
        );

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