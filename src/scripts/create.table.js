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

const createFriendsTable = `CREATE TABLE IF NOT EXISTS FRIENDSHIPS (
    id UUID PRIMARY KEY,
    userOneId UUID NOT NULL,
    userTwoId UUID NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (userOneId < userTwoId),
    UNIQUE (userOneId, userTwoId)
);`
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
    console.log("Friendships table ready");

  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await pool.end();
  }
}

initDB();
