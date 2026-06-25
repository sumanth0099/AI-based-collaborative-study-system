const cloudinary = require("cloudinary").v2;
const pool = require("../config.js");
const createID = require("../utils/generateuuid.js");
// require("dotenv").config(); // Removed redundant call - already handled in server.js/config.js

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

        const userId = req.session ? req.session.userId : null;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await uploadToCloudinary(req.file.buffer);
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

        // Fetch all files uploaded by the user or shared with them (just checking their notes for now)
        const result = await pool.query(`
            SELECT id, originalfilename AS "originalFileName", filesize AS "fileSize", mimetype AS "mimeType", cloudinaryurl AS "cloudinaryUrl", cloudinarypublicid AS "cloudinaryPublicId", createdat AS "createdAt"
            FROM notes
            WHERE (userid = $1 OR createdby = $1)
              AND contenttype = 'file'
              AND (isarchived IS NULL OR isarchived = FALSE)
            ORDER BY createdat DESC
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
            SELECT id, originalfilename AS "originalFileName", filesize AS "fileSize", mimetype AS "mimeType", cloudinaryurl AS "cloudinaryUrl", cloudinarypublicid AS "cloudinaryPublicId", createdat AS "createdAt"
            FROM notes
            WHERE id = $1 AND (userid = $2 OR createdby = $2) AND contenttype = 'file' AND (isarchived IS NULL OR isarchived = FALSE)
        `, [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Resource not found" });
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
            SELECT id, cloudinarypublicid AS "cloudinaryPublicId"
            FROM notes
            WHERE id = $1 AND createdby = $2 AND contenttype = 'file'
        `, [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Resource not found or unauthorized to delete" });
        }

        const resource = result.rows[0];

        // delete from cloudinary
        if (resource.cloudinaryPublicId) {
            await deleteFromCloudinary(resource.cloudinaryPublicId);
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
        
        // This is a placeholder since there is no standard shared functionality implemented in schema yet.
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