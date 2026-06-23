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

    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
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

    await pool.query(createNotificationTable);
    console.log("Notifications table ready");

    await pool.query(createStudyGroupMembersTable);
    console.log("Study group member table ready")

    await pool.query(createGroupMessages);
    console.log("Group Messages table ready")

  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await pool.end();
  }
}

initDB();
