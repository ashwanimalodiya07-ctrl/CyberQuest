const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Frontend static files server karne ke liye
app.use(express.static(path.join(__dirname)));

// Sample Database (In-Memory for now)
let db = {
    candidates: [],
    results: [],
    questions: [
        { id: 1, question: "Which is the smallest type of network?", category: "mcq", answer: "PAN", marks: 1 },
        { id: 2, question: "What is the full form of VPN?", category: "mcq", answer: "Virtual Private Network", marks: 1 }
    ]
};

// =========================================
// API ROUTES
// =========================================

// 1. Check server status
app.get("/api/status", (req, res) => {
    res.json({ status: "Online", message: "CyberQuest Backend is running fine!" });
});

// 2. Fetch all questions
app.get("/api/questions", (req, res) => {
    res.json(db.questions);
});

// 3. Submit Quiz (Save Result & Candidate)
app.post("/api/submit-quiz", (req, res) => {
    const candidateData = req.body;
    db.candidates.push(candidateData);
    
    // Auto score demo calculation for objective
    const newResult = {
        name: candidateData.name,
        email: candidateData.email,
        school: candidateData.school,
        marks: candidateData.score || 0
    };
    db.results.push(newResult);

    res.json({ success: true, message: "Quiz submitted and saved to server!" });
});

// 4. Admin Login Endpoint
app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (email === "owner@cyberquest.local" && password === "Owner@123") {
        return res.json({ success: true, role: "super", name: "CyberQuest Owner" });
    } else if (email === "exam@cyberquest.local" && password === "Exam@123") {
        return res.json({ success: true, role: "exam", name: "Exam Administrator" });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Server Start
app.listen(PORT, () => {
    console.log(`🚀 CyberQuest Server running on http://localhost:${PORT}`);
});