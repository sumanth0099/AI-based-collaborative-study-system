const pool = require("../config");

const getGroupMessages = async (req,res)=>{
    try{

        const {groupId}=req.params;

       const result = await pool.query(
`
SELECT
gm.*,
u.name AS sender_name,
sg.name AS group_name
FROM group_messages gm
JOIN users u
ON gm.senderId = u.id
JOIN study_groups sg
ON gm.groupId = sg.id
WHERE gm.groupId = $1
ORDER BY gm.createdAt
`,
[groupId]
);

        res.status(200).json({
            success:true,
            messages:result.rows
        });

    }
    catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:"Internal server error"
        });

    }
};

module.exports={
    getGroupMessages
};