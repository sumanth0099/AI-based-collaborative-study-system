const pool = require('../config.js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const apNames = [
    "Venkatesh Reddy", "Srinivas Rao", "Lakshmi Prasanna", "Surya Prakash", "Ravi Teja",
    "Swathi Naidu", "Krishna Vamsi", "Ramya Krishna", "Harsha Vardhan", "Anusha Chowdary",
    "Karthik Varma", "Divya Sree", "Mahesh Babu", "Bhavani Shankar", "Kiran Kumar"
];

const groupNames = [
    "EAMCET Physics & Chemistry", 
    "JNTU B.Tech CSE Coders", 
    "APPSC Group 1 Aspirants",
    "GATE ECE Prep AP", 
    "UPSC Telugu Medium"
];

const subjects = ["Mathematics", "Physics", "Computer Science", "History", "Electronics"];

async function seedDB() {
    try {
        console.log("Starting advanced database seed...");

        // Note: Using CASCADE would clear all tables
        // await pool.query('TRUNCATE TABLE quiz_attempts, group_join_requests, notifications, group_messages, study_group_members, friend_requests, friends, notes, study_groups, users CASCADE');

        const passwordHash = await bcrypt.hash('password123', 10);
        const users = [];
        
        // 1. Create 15 Users
        console.log("Creating users...");
        for (let i = 0; i < 15; i++) {
            const id = uuidv4();
            const email = `${apNames[i].split(' ')[0].toLowerCase()}${i}@example.com`;
            await pool.query(`
                INSERT INTO users (id, email, password_hash, name, is_verified, created_at, updated_at)
                VALUES ($1, $2, $3, $4, true, NOW(), NOW())
            `, [id, email, passwordHash, apNames[i]]);
            users.push({ id, name: apNames[i] });
        }

        // 2. Create 5 Study Groups
        console.log("Creating study groups...");
        const groups = [];
        for (let i = 0; i < 5; i++) {
            const id = uuidv4();
            const owner = users[i].id; // First 5 users own the 5 groups
            await pool.query(`
                INSERT INTO study_groups (id, name, description, createdBy, isPrivate, createdAt, updatedAt)
                VALUES ($1, $2, $3, $4, false, NOW(), NOW())
            `, [id, groupNames[i], `Discussion group for ${groupNames[i]}`, owner]);
            groups.push({ id, name: groupNames[i], owner });
        }

        // 3. Populate Study Group Members
        console.log("Adding members to groups...");
        for (let i = 0; i < 5; i++) {
            // Add owner
            await pool.query(`
                INSERT INTO study_group_members (id, groupId, userId, role, joinedAt)
                VALUES ($1, $2, $3, 'owner', NOW())
            `, [uuidv4(), groups[i].id, groups[i].owner]);

            // Add 4 more random users to each group
            for (let j = 1; j <= 4; j++) {
                const memberIndex = (i + j + 5) % 15;
                await pool.query(`
                    INSERT INTO study_group_members (id, groupId, userId, role, joinedAt)
                    VALUES ($1, $2, $3, 'member', NOW())
                `, [uuidv4(), groups[i].id, users[memberIndex].id]);
            }
        }

        // 4. Create Notes for ALL users
        console.log("Creating notes...");
        const notes = [];
        for (let i = 0; i < 15; i++) {
            const id = uuidv4();
            const subject = subjects[i % subjects.length];
            await pool.query(`
                INSERT INTO notes (id, userId, createdBy, name, subject, topic, content, contentType, createdAt, updatedAt)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'text', NOW(), NOW())
            `, [
                id, users[i].id, users[i].id, 
                `${subject} Basics`, subject, `Introduction to ${subject}`, 
                `These are some important points about ${subject} by ${users[i].name}.`
            ]);
            notes.push({ id, subject });
        }

        // 5. Create Friends
        console.log("Creating friends...");
        for (let i = 0; i < 10; i++) {
            await pool.query(`
                INSERT INTO FRIENDS (id, userOneId, userTwoId, createdAt)
                VALUES ($1, $2, $3, NOW())
            `, [uuidv4(), users[i].id, users[i+1].id]);
        }

        // 6. Create Friend Requests
        console.log("Creating friend requests...");
        for (let i = 10; i < 14; i++) {
            await pool.query(`
                INSERT INTO friend_requests (id, senderId, receiverId, status, createdAt)
                VALUES ($1, $2, $3, 'pending', NOW())
            `, [uuidv4(), users[i].id, users[0].id]);
        }

        // 7. Create Group Messages
        console.log("Creating group messages...");
        const messageIds = [];
        for (let i = 0; i < 5; i++) {
            const msgId = uuidv4();
            await pool.query(`
                INSERT INTO group_messages (id, groupId, senderId, messageType, content, createdAt)
                VALUES ($1, $2, $3, 'text', $4, NOW())
            `, [msgId, groups[i].id, groups[i].owner, `Welcome to ${groups[i].name}!`]);
            messageIds.push(msgId);
        }

        // 8. Create Notifications
        console.log("Creating notifications...");
        for (let i = 0; i < 3; i++) {
            await pool.query(`
                INSERT INTO notifications (id, receiverId, type, message, is_sent, createdAt, groupId, messageId)
                VALUES ($1, $2, 'group_message', 'New message in group', false, NOW(), $3, $4)
            `, [uuidv4(), users[14].id, groups[0].id, messageIds[0]]);
        }

        // 9. Create Group Join Requests
        console.log("Creating group join requests...");
        for (let i = 0; i < 2; i++) {
            await pool.query(`
                INSERT INTO group_join_requests (id, groupId, userId, status, requestedAt)
                VALUES ($1, $2, $3, 'pending', NOW())
            `, [uuidv4(), groups[0].id, users[12 + i].id]);
        }

        // 10. Create Quiz Attempts
        console.log("Creating quiz attempts...");
        for (let i = 0; i < 5; i++) {
            await pool.query(`
                INSERT INTO quiz_attempts (id, userId, noteId, subject, topic, difficulty, totalQuestions, correctAnswers, wrongAnswers, maxMarks, obtainedMarks, percentage, attemptedAt)
                VALUES ($1, $2, $3, $4, $5, 'medium', 10, 8, 2, 10, 8, 80.00, NOW())
            `, [uuidv4(), users[i].id, notes[i].id, notes[i].subject, 'Basics']);
        }

        console.log("Advanced seeding complete!");

    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await pool.end();
    }
}

seedDB();
