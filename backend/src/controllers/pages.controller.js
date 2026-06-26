const pool = require("../config");

const generateAIInsight = async (userData) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY2}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `
You are a study coach.

Generate ONE short personalized study insight.

Rules:
- Maximum 2 sentences.
- Be encouraging.
- Mention subjects/topics if possible.
- Return only the insight text.
`
            },
            {
              role: "user",
              content: JSON.stringify(userData)
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      }
    );

    const data = await response.json();

    return (
      data?.choices?.[0]?.message?.content ||
      "Keep making progress on your recent notes."
    );

  } catch (err) {
    console.error("AI Insight Error:", err);

    return "Keep making progress on your recent notes.";
  }
};

const getHomePageData = async (req, res) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const [
      notesCountResult,
      groupsCountResult,
      friendsCountResult,
      notificationsCountResult,

      recentNotesResult,
      recentActivityResult,
      myGroupsResult,

      friendRequestsResult,
      groupJoinRequestsResult
    ] = await Promise.all([
      // Stats
      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM notes
        WHERE userId = $1
        AND isArchived = FALSE
        `,
        [userId]
      ),

      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM study_group_members
        WHERE userId = $1
        `,
        [userId]
      ),

      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM friends
        WHERE userOneId = $1
           OR userTwoId = $1
        `,
        [userId]
      ),

      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM notifications
        WHERE receiverId = $1
        AND is_sent = FALSE
        `,
        [userId]
      ),

      // Recent Notes
      pool.query(
        `
        SELECT
          id,
          name,
          subject,
          topic,
          topicImportance,
          updatedAt
        FROM notes
        WHERE userId = $1
        AND isArchived = FALSE
        ORDER BY updatedAt DESC
        LIMIT 5
        `,
        [userId]
      ),

      // Recent Activity
      pool.query(
        `
        SELECT
          gm.id,
          gm.content,
          gm.createdAt,
          u.name AS sender_name,
          sg.name AS group_name
        FROM group_messages gm
        JOIN users u
          ON gm.senderId = u.id
        JOIN study_groups sg
          ON gm.groupId = sg.id
        JOIN study_group_members sgm
          ON sg.id = sgm.groupId
        WHERE sgm.userId = $1
        ORDER BY gm.createdAt DESC
        LIMIT 10
        `,
        [userId]
      ),

      // My Groups
      pool.query(
        `
        SELECT
          sg.id,
          sg.name,
          sg.avatar,
          COUNT(sgm2.userId)::int AS member_count
        FROM study_groups sg
        JOIN study_group_members sgm
          ON sg.id = sgm.groupId
        LEFT JOIN study_group_members sgm2
          ON sg.id = sgm2.groupId
        WHERE sgm.userId = $1
        GROUP BY sg.id
        LIMIT 5
        `,
        [userId]
      ),

      // Friend Requests
      pool.query(
        `
        SELECT
          fr.id,
          u.id AS sender_id,
          u.name,
          u.avatar
        FROM friend_requests fr
        JOIN users u
          ON fr.senderId = u.id
        WHERE fr.receiverId = $1
        AND fr.status = 'pending'
        LIMIT 5
        `,
        [userId]
      ),

      // Group Join Requests
      pool.query(
        `
        SELECT
          gjr.id,
          sg.name AS group_name,
          u.name AS user_name
        FROM group_join_requests gjr
        JOIN study_groups sg
          ON gjr.groupId = sg.id
        JOIN users u
          ON gjr.userId = u.id
        WHERE sg.createdBy = $1
        AND gjr.status = 'pending'
        LIMIT 5
        `,
        [userId]
      )
    ]);

    const aiInput = {
      stats: {
        notes: notesCountResult.rows[0].count,
        groups: groupsCountResult.rows[0].count,
        friends: friendsCountResult.rows[0].count
      },

      recentNotes: recentNotesResult.rows.map(note => ({
        subject: note.subject,
        topic: note.topic,
        importance: note.topicimportance
      })),

      groups: myGroupsResult.rows.map(group => group.name)
    };

    const aiInsight = await generateAIInsight(aiInput);

    return res.status(200).json({
      success: true,

      data: {
        stats: {
          notes: notesCountResult.rows[0].count,
          groups: groupsCountResult.rows[0].count,
          friends: friendsCountResult.rows[0].count,
          unreadNotifications:
            notificationsCountResult.rows[0].count
        },

        aiInsight,

        recentNotes: recentNotesResult.rows,

        pendingActions: {
          friendRequests: friendRequestsResult.rows,
          groupJoinRequests: groupJoinRequestsResult.rows,
          unreadNotifications:
            notificationsCountResult.rows[0].count
        },

        recentActivity: recentActivityResult.rows,

        myGroups: myGroupsResult.rows,

        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("getHomePageData:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const generateDashboardInsight = async (dashboardData) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY2}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `
You are an educational analytics coach.

Analyze the student's study and quiz performance.

Rules:
- Maximum 4 sentences.
- Mention one strength.
- Mention one weak area if applicable.
- Suggest one actionable improvement.
- Be encouraging.
- Return only plain text.
`
            },
            {
              role: "user",
              content: JSON.stringify(dashboardData)
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      }
    );

    const data = await response.json();

    return (
      data?.choices?.[0]?.message?.content ||
      "Your study progress is moving in the right direction. Keep building consistency."
    );

  } catch (err) {
    console.error(err);

    return "Your study progress is moving in the right direction. Keep building consistency.";
  }
};



const getDashboardData = async (req, res) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const [
      totalNotesResult,
      totalGroupsResult,
      totalFriendsResult,

      notesBySubjectResult,
      highPriorityNotesResult,
      monthlyActivityResult,
      groupStatsResult,

      quizOverviewResult,
      recentQuizAttemptsResult,
      topicPerformanceResult

    ] = await Promise.all([

      // Total Notes
      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM notes
        WHERE userId = $1
        AND isArchived = FALSE
        `,
        [userId]
      ),

      // Total Groups
      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM study_group_members
        WHERE userId = $1
        `,
        [userId]
      ),

      // Total Friends
      pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM friends
        WHERE userOneId = $1
           OR userTwoId = $1
        `,
        [userId]
      ),

      // Subject Distribution
      pool.query(
        `
        SELECT
          subject,
          COUNT(*)::int AS count
        FROM notes
        WHERE userId = $1
          AND isArchived = FALSE
          AND subject IS NOT NULL
        GROUP BY subject
        ORDER BY count DESC
        `,
        [userId]
      ),

      // High Priority Notes
      pool.query(
        `
        SELECT
          id,
          name,
          subject,
          topic,
          updatedAt
        FROM notes
        WHERE userId = $1
          AND topicImportance = 'high'
          AND isArchived = FALSE
        ORDER BY updatedAt DESC
        LIMIT 10
        `,
        [userId]
      ),

      // Monthly Activity
      pool.query(
        `
        SELECT
          TO_CHAR(createdAt, 'YYYY-MM') AS month,
          COUNT(*)::int AS notes_created
        FROM notes
        WHERE userId = $1
        GROUP BY month
        ORDER BY month
        `,
        [userId]
      ),

      // Group Statistics
      pool.query(
        `
        SELECT
          sg.id,
          sg.name,
          COUNT(sgm2.userId)::int AS members
        FROM study_groups sg
        JOIN study_group_members sgm
          ON sg.id = sgm.groupId
        LEFT JOIN study_group_members sgm2
          ON sg.id = sgm2.groupId
        WHERE sgm.userId = $1
        GROUP BY sg.id
        ORDER BY members DESC
        `,
        [userId]
      ),

      // Quiz Overview
      pool.query(
        `
        SELECT
          COUNT(*)::int AS total_attempts,
          COALESCE(ROUND(AVG(percentage),2),0) AS average_score,
          COALESCE(MAX(percentage),0) AS best_score
        FROM quiz_attempts
        WHERE userId = $1
        `,
        [userId]
      ),

      // Recent Quiz Attempts
      pool.query(
        `
        SELECT
          topic,
          subject,
          obtainedMarks,
          maxMarks,
          percentage,
          attemptedAt
        FROM quiz_attempts
        WHERE userId = $1
        ORDER BY attemptedAt DESC
        LIMIT 10
        `,
        [userId]
      ),

      // Topic Performance
      pool.query(
        `
        SELECT
          topic,
          COUNT(*)::int AS attempts,
          ROUND(AVG(percentage),2) AS average_score,
          MAX(percentage) AS best_score
        FROM quiz_attempts
        WHERE userId = $1
        GROUP BY topic
        ORDER BY average_score DESC
        `,
        [userId]
      )
    ]);

    const aiInput = {
      totalNotes: totalNotesResult.rows[0].count,

      notesBySubject:
        notesBySubjectResult.rows,

      highPriorityNotes:
        highPriorityNotesResult.rows.length,

      quizzes: {
        totalAttempts:
          quizOverviewResult.rows[0].total_attempts,

        averageScore:
          quizOverviewResult.rows[0].average_score,

        bestScore:
          quizOverviewResult.rows[0].best_score,

        topicPerformance:
          topicPerformanceResult.rows
      }
    };

    const aiSummary =
      await generateDashboardInsight(aiInput);

    const strongTopics =
      topicPerformanceResult.rows.filter(
        topic => Number(topic.average_score) >= 75
      );

    const weakTopics =
      topicPerformanceResult.rows.filter(
        topic => Number(topic.average_score) < 50
      );

    return res.status(200).json({
      success: true,
      data: {
        totalNotes: totalNotesResult.rows[0].count,
        totalGroups: totalGroupsResult.rows[0].count,
        totalFriends: totalFriendsResult.rows[0].count,
        quizOverview: {
          totalAttempts: quizOverviewResult.rows[0].total_attempts,
          averageScore: Number(quizOverviewResult.rows[0].average_score),
          bestScore: Number(quizOverviewResult.rows[0].best_score)
        },
        recentQuizAttempts: recentQuizAttemptsResult.rows,
        topicPerformance: topicPerformanceResult.rows,
        strongTopics,
        weakTopics,
        notesBySubject: notesBySubjectResult.rows,
        topSubjects: notesBySubjectResult.rows.slice(0, 5),
        highPriorityNotes: highPriorityNotesResult.rows,
        monthlyActivity: monthlyActivityResult.rows,
        groupStatistics: groupStatsResult.rows,
        aiSummary,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("getDashboardData:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = {
  getHomePageData,getDashboardData
};