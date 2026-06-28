const express = require("express");
const { XMLParser } = require("fast-xml-parser");

const router = express.Router();

const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (tagName) => tagName === "item"
});

// Focused RSS feeds per category (No OR operators)
const feeds = {
    scholarships: [
        "https://news.google.com/rss/search?q=scholarship&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=national+scholarship+portal&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=UGC+scholarship&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=AICTE+scholarship&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=merit+cum+means+scholarship&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    admissions: [
        "https://news.google.com/rss/search?q=college+admission&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=university+admission&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=DU+admission&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=counselling+admission&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    exams: [
        "https://news.google.com/rss/search?q=JEE+Main&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=JEE+Advanced&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=NEET+UG&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=CUET&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=UPSC&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=board+exam&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    jobs: [
        "https://news.google.com/rss/search?q=internship&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=fresher+job&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=campus+placement&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    government: [
        "https://news.google.com/rss/search?q=UGC&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=AICTE&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=CBSE&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=Ministry+of+Education&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    financialAid: [
        "https://news.google.com/rss/search?q=education+loan&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=student+loan&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    studyAbroad: [
        "https://news.google.com/rss/search?q=study+abroad&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=international+student+India&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    courses: [
        "https://news.google.com/rss/search?q=free+online+course&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=SWAYAM+course&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=NPTEL&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    competitions: [
        "https://news.google.com/rss/search?q=hackathon&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=olympiad&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=quiz+competition&hl=en-IN&gl=IN&ceid=IN:en"
    ],
    research: [
        "https://news.google.com/rss/search?q=research+grant&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=PhD+admission&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=research+fellowship&hl=en-IN&gl=IN&ceid=IN:en"
    ]
};

/**
 * Fetch RSS feed with 5-second timeout
 */
async function fetchRSS(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();
        return parser.parse(xml);
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn(`Timeout fetching: ${url}`);
        } else {
            console.warn(`Failed to fetch ${url}:`, err.message);
        }
        return null;
    }
}

/**
 * Clean description: remove HTML, decode entities, normalize spaces
 */
function cleanDescription(description) {
    if (!description) return "";

    return description
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Parse single article
 */
function parseArticle(item, category) {
    // Support both <source url="...">Name</source> and plain <source>Name</source>
    let source = "";
    if (item.source) {
        source = typeof item.source === "object" 
            ? (item.source["#text"] || "") 
            : String(item.source);
    }

    return {
        category,
        title: item.title?.trim() || "",
        description: cleanDescription(item.description),
        link: item.link?.trim() || "",
        publishedAt: item.pubDate || "",
        source: source.trim()
    };
}

/**
 * Smart deduplication: guid → normalized title → link
 */
function deduplicateArticles(articles) {
    const seen = new Map();

    function normalizeTitle(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    for (const article of articles) {
        let key = null;

        if (article.guid) {
            key = `guid:${article.guid}`;
        } else if (article.title) {
            const normTitle = normalizeTitle(article.title);
            if (normTitle.length > 5) {
                key = `title:${normTitle}`;
            }
        }

        if (!key && article.link) {
            key = `link:${article.link}`;
        }

        if (!key) continue;

        const existing = seen.get(key);
        const newTime = new Date(article.publishedAt).getTime();

        if (!existing || isNaN(newTime) || newTime > new Date(existing.publishedAt).getTime()) {
            seen.set(key, article);
        }
    }

    return Array.from(seen.values());
}

/**
 * Sort articles by published date (newest first)
 */
function sortArticles(articles) {
    return articles.sort((a, b) => {
        const timeA = new Date(a.publishedAt).getTime();
        const timeB = new Date(b.publishedAt).getTime();

        if (isNaN(timeB)) return -1;
        if (isNaN(timeA)) return 1;

        return timeB - timeA;
    });
}

/**
 * Return only top N articles
 */
function getTopArticles(articles, limit = 10) {
    return articles.slice(0, limit);
}

/**
 * Main handler - fetches, parses, deduplicates, and sorts news
 */
async function getEducationNews(category) {
    const categoryFeeds = feeds[category];
    if (!categoryFeeds) {
        throw new Error("Invalid category");
    }

    // Fetch all feeds in parallel
    const promises = categoryFeeds.map(url => fetchRSS(url));

    const results = await Promise.all(promises);

    let allArticles = [];

    results.forEach((result, index) => {
        if (!result?.rss?.channel?.item) return;

        const items = Array.isArray(result.rss.channel.item) 
            ? result.rss.channel.item 
            : [result.rss.channel.item];

        const parsed = items
            .map(item => parseArticle(item, category))
            .filter(a => a.title && a.link);

        allArticles = allArticles.concat(parsed);
    });

    // Process results
    let processed = deduplicateArticles(allArticles);
    processed = sortArticles(processed);
    processed = getTopArticles(processed, 10);

    return processed;
}

// Route
router.get("/:category", async (req, res) => {
    try {
        const { category } = req.params;

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Category is required"
            });
        }

        const articles = await getEducationNews(category);

        return res.json({
            success: true,
            category,
            count: articles.length,
            updatedAt: new Date().toISOString(),
            data: articles
        });

    } catch (err) {
        console.error("News API Error:", err);

        if (err.message === "Invalid category") {
            return res.status(404).json({
                success: false,
                message: "Invalid category. Available: " + Object.keys(feeds).join(", ")
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch education news. Please try again later."
        });
    }
});

module.exports = router;