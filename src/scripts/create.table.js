    const pool = require('../config.js');

    const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        google_id VARCHAR(255) UNIQUE,
        name VARCHAR(120) NOT NULL,
        avatar TEXT,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL);`;

    const createStudyGroupsTable = `
    CREATE TABLE IF NOT EXISTS study_groups (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        avatar TEXT,
        createdBy UUID REFERENCES users(id),
        isPrivate BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    const createNotesTable = `
    CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY,
        userId UUID REFERENCES users(id),
        groupId UUID REFERENCES study_groups(id),
        createdBy UUID REFERENCES users(id),
        name VARCHAR(255),
        subject VARCHAR(120),
        topic VARCHAR(255),
        content TEXT,
        contentType VARCHAR(50),
        topicImportance VARCHAR(20),
        tags TEXT[],
        originalFileName VARCHAR(255),
        storedFileName VARCHAR(255),
        cloudinaryPublicId VARCHAR(255),
        cloudinaryUrl TEXT,
        fileSize BIGINT,
        mimeType VARCHAR(120),
        isArchived BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    const createStudyGroupMembersTable = `
    CREATE TABLE IF NOT EXISTS study_group_members (
        id UUID PRIMARY KEY,
        groupId UUID NOT NULL,
        userId UUID NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (groupId)
        REFERENCES study_groups(id)
        ON DELETE CASCADE,

        FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

        UNIQUE(groupId, userId),

        CHECK(role IN ('owner', 'admin', 'member'))
    );
    `;


    const createFriendsTable = `CREATE TABLE IF NOT EXISTS FRIENDS (
        id UUID PRIMARY KEY,
        userOneId UUID NOT NULL,
        userTwoId UUID NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (userOneId, userTwoId)
    );`

    const createFRIEND_REQUESTS  = `
    CREATE TABLE IF NOT EXISTS friend_requests (
        id UUID PRIMARY KEY,
        senderId UUID NOT NULL,
        receiverId UUID NOT NULL,
        status VARCHAR(30) NOT NULL,
        createdAt TIMESTAMP NOT NULL,
        respondedAt TIMESTAMP,

        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,

        CHECK (senderId <> receiverId)
    );
    `;

    const createNotificationTable = `
    CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        receiverId UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_sent BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL,

        groupId UUID,
        groupName VARCHAR(255),
        messageId UUID,

        FOREIGN KEY (receiverId)
        REFERENCES users(id)
        ON DELETE CASCADE,

        FOREIGN KEY (groupId)
        REFERENCES study_groups(id)
        ON DELETE CASCADE,

        FOREIGN KEY (messageId)
        REFERENCES group_messages(id)
        ON DELETE CASCADE
    );
    `;
    const createGroupMessages=`
    CREATE TABLE IF NOT EXISTS group_messages (
        id UUID PRIMARY KEY,
        groupId UUID NOT NULL,
        senderId UUID NOT NULL,
        messageType VARCHAR(50) DEFAULT 'text',
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (groupId) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
    );
    `;
    const groupJoinRequests=`
    CREATE TABLE IF NOT EXISTS group_join_requests (
        id UUID PRIMARY KEY,

        groupId UUID NOT NULL,
        userId UUID NOT NULL,

        status VARCHAR(20) NOT NULL DEFAULT 'pending'
            CHECK (status IN ('pending', 'approved', 'rejected')),

        requestedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        reviewedBy UUID,
        reviewedAt TIMESTAMP,

        FOREIGN KEY (groupId)
            REFERENCES study_groups(id)
            ON DELETE CASCADE,

        FOREIGN KEY (userId)
            REFERENCES users(id)
            ON DELETE CASCADE,

        FOREIGN KEY (reviewedBy)
            REFERENCES users(id)
            ON DELETE SET NULL,

        CONSTRAINT unique_group_user_request
            UNIQUE (groupId, userId)
    );
    `;

    const createQuizAttemptsTable = `
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY,

    userId UUID NOT NULL,
    noteId UUID,

    subject VARCHAR(120),
    topic VARCHAR(255),

    difficulty VARCHAR(20),

    totalQuestions INTEGER NOT NULL,
    correctAnswers INTEGER NOT NULL,
    wrongAnswers INTEGER NOT NULL,

    maxMarks INTEGER NOT NULL,
    obtainedMarks INTEGER NOT NULL,

    percentage NUMERIC(5,2),

    attemptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (noteId)
        REFERENCES notes(id)
        ON DELETE SET NULL
);
`;
    async function initDB() {
    try {
        // Order matters because of foreign key constraints
        await pool.query(createUserTable);
        console.log("Users table ready");

        await pool.query(createStudyGroupsTable);
        console.log("Study Groups table ready");

        await pool.query(createNotesTable);
        console.log("Notes table ready");

        await pool.query(createFriendsTable);
        console.log("Friends table ready");

        await pool.query(createFRIEND_REQUESTS);
        console.log("Friend Requests table ready");

    

        await pool.query(createStudyGroupMembersTable);
        console.log("Study group member table ready")

        await pool.query(createGroupMessages);
        console.log("Group Messages table ready")

        await pool.query(createNotificationTable);
        console.log("Notifications table ready");

        await pool.query(groupJoinRequests);
        console.log("Group Join Requests table ready")

        await pool.query(createQuizAttemptsTable);
        console.log("Quiz Attempts table ready");
        
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        await pool.end();
    }
    }

    initDB();
