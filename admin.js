"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // 1. CONFIGURATION
    // =========================================

    const STORAGE_KEY = "cyberquest_admin_demo_v2";
    const THEME_KEY = "cyberquest_admin_theme";

    const DEMO_ADMINS = [
        {
            name: "CyberQuest Owner",
            email: "owner@cyberquest.local",
            password: "Owner@123",
            role: "super"
        },
        {
            name: "Exam Administrator",
            email: "exam@cyberquest.local",
            password: "Exam@123",
            role: "exam"
        }
    ];

    // =========================================
    // 2. HTML ELEMENTS
    // =========================================

    const loginScreen = document.getElementById("admin-login");
    const dashboard = document.getElementById("admin-dashboard");

    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");

    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".admin-section");

    const superAdminMenu = document.getElementById("super-admin-menu");
    const themeToggleBtn = document.getElementById("theme-toggle");

    let currentAdmin = null;

    // =========================================
    // 3. DEMO DATABASE
    // =========================================

    function getDatabase() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                return {
                    candidates: Array.isArray(data.candidates) ? data.candidates : [],
                    questions: Array.isArray(data.questions) ? data.questions : getDefaultQuestions(),
                    results: Array.isArray(data.results) ? data.results : [],
                    admins: Array.isArray(data.admins) ? data.admins : [],
                    settings: {
                        title: data.settings?.title || "CyberQuest – The Tech Quiz",
                        duration: Number(data.settings?.duration || 60),
                        passingMarks: Number(data.settings?.passingMarks ?? 45),
                        registrationOpen: data.settings?.registrationOpen !== false
                    }
                };
            }
        } catch (error) {
            console.error("Database loading error:", error);
        }

        return {
            candidates: [],
            questions: getDefaultQuestions(),
            results: [],
            admins: [],
            settings: {
                title: "CyberQuest – The Tech Quiz",
                duration: 60,
                passingMarks: 45,
                registrationOpen: true
            }
        };
    }

    function getDefaultQuestions() {
        return [
            { id: 1, question: "Which is the smallest type of network?", category: "mcq", answer: "PAN", marks: 1 },
            { id: 2, question: "What is the full form of VPN?", category: "mcq", answer: "Virtual Private Network", marks: 1 },
            { id: 3, question: "What is the process of starting a computer?", category: "fill", answer: "Booting", marks: 1 }
        ];
    }

    let db = getDatabase();

    function saveDatabase() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        } catch (error) {
            console.error("Database saving error:", error);
            alert("Unable to save data. Browser storage may be full.");
        }
    }

    // =========================================
    // 4. HELPER FUNCTIONS
    // =========================================

    function getElement(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = getElement(id);
        if (element) element.textContent = value;
    }

    function setValue(id, value) {
        const element = getElement(id);
        if (element) element.value = value;
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value ?? "N/A";
        return cell;
    }

    function createButton(text, className, callback) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.className = className;
        button.addEventListener("click", callback);
        return button;
    }

    function isSuperAdmin() {
        return currentAdmin?.role === "super";
    }

    // =========================================
    // 5. THEME TOGGLE
    // =========================================

    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === "light") {
            document.body.classList.add("light-theme");
            if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("light-theme");
            const isLight = document.body.classList.contains("light-theme");
            themeToggleBtn.textContent = isLight ? "☀️" : "🌙";
            localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
        });
    }

    initTheme();

    // =========================================
    // 6. LOGIN SYSTEM
    // =========================================

    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();
            const email = getElement("admin-email").value.trim().toLowerCase();
            const password = getElement("admin-password").value;

            let admin = DEMO_ADMINS.find(item => item.email === email && item.password === password);

            if (!admin) {
                admin = db.admins.find(item => item.email.toLowerCase() === email && item.password === password);
            }

            if (!admin) {
                loginError.textContent = "Invalid email address or password!";
                return;
            }

            currentAdmin = admin;
            loginError.textContent = "";
            loginForm.reset();
            showDashboard();
        });
    }

    function showDashboard() {
        loginScreen.hidden = true;
        dashboard.hidden = false;
        applyRolePermissions();
        setText("admin-name", currentAdmin.name);
        setText("admin-role", isSuperAdmin() ? "Super Admin" : "Exam Admin");
        showSection("dashboard");
        updateDashboard();
        updateReports();
        loadSettings();
    }

    // =========================================
    // 7. ROLE PERMISSIONS & NAVIGATION
    // =========================================

    function applyRolePermissions() {
        if (superAdminMenu) {
            superAdminMenu.hidden = !isSuperAdmin();
        }
    }

    function canOpenSection(sectionName) {
        const restrictedSections = ["admins", "settings", "security"];
        if (restrictedSections.includes(sectionName) && !isSuperAdmin()) {
            alert("You do not have permission to access this section.");
            return false;
        }
        return true;
    }

    function showSection(sectionName) {
        if (!canOpenSection(sectionName)) return;

        sections.forEach(section => {
            section.hidden = section.id !== "section-" + sectionName;
        });

        navLinks.forEach(link => {
            link.classList.toggle("active", link.dataset.section === sectionName);
        });

        const titles = {
            dashboard: "Dashboard",
            candidates: "Candidates",
            questions: "Manage Questions",
            results: "Examination Results",
            leaderboard: "Leaderboard",
            certificates: "Certificates",
            admins: "Manage Admins",
            settings: "Website Settings",
            security: "Security Settings",
            reports: "Reports & Analytics"
        };

        setText("page-title", titles[sectionName] || "Dashboard");
    }

    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            if (!currentAdmin) return;
            const sectionName = link.dataset.section;
            if (!sectionName || !canOpenSection(sectionName)) return;

            showSection(sectionName);

            switch (sectionName) {
                case "dashboard": updateDashboard(); break;
                case "candidates": renderCandidates(); break;
                case "questions": renderQuestions(); break;
                case "results": renderResults(); break;
                case "leaderboard": renderLeaderboard(); break;
                case "admins": renderAdmins(); break;
                case "reports": updateReports(); break;
            }
        });
    });

    // =========================================
    // 8. DASHBOARD STATISTICS
    // =========================================

    function updateDashboard() {
        setText("total-candidates", db.candidates.length);
        setText("total-questions", db.questions.length);

        const passing = db.settings.passingMarks;
        const qualified = db.results.filter(r => Number(r.marks) >= passing);
        const failed = db.results.filter(r => Number(r.marks) < passing);

        setText("qualified-candidates", qualified.length);
        setText("failed-candidates", failed.length);

        renderRecentCandidates();
        updateReports();
    }

    function renderRecentCandidates() {
        const container = getElement("recent-candidates");
        if (!container) return;
        container.replaceChildren();

        const recent = db.candidates.slice(-5).reverse();
        if (recent.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.textContent = "No registrations available.";
            row.appendChild(cell);
            container.appendChild(row);
            return;
        }

        recent.forEach((candidate, index) => {
            const row = document.createElement("tr");
            row.append(
                createCell(candidate.id || index + 1),
                createCell(candidate.name),
                createCell(candidate.email),
                createCell(candidate.school || "N/A"),
                createCell(candidate.status || "Registered")
            );
            container.appendChild(row);
        });
    }

    // =========================================
    // 9. CANDIDATE MANAGEMENT
    // =========================================

    function renderCandidates(search = "") {
        const container = getElement("candidate-list");
        if (!container) return;
        container.replaceChildren();

        const filtered = db.candidates.filter(c => {
            const text = [c.name, c.email, c.phone, c.school].join(" ").toLowerCase();
            return text.includes(search.toLowerCase());
        });

        if (filtered.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 7;
            cell.textContent = "No candidates found.";
            row.appendChild(cell);
            container.appendChild(row);
            return;
        }

        filtered.forEach((candidate, index) => {
            const row = document.createElement("tr");
            row.append(
                createCell(candidate.id || index + 1),
                createCell(candidate.name),
                createCell(candidate.email),
                createCell(candidate.phone || "N/A"),
                createCell(candidate.school || "N/A"),
                createCell(candidate.age || "N/A")
            );

            const actionCell = document.createElement("td");
            if (isSuperAdmin()) {
                const delBtn = createButton("Delete", "delete-button", () => {
                    if (!confirm("Delete this candidate?")) return;
                    db.candidates = db.candidates.filter(item => item !== candidate);
                    saveDatabase();
                    renderCandidates();
                    updateDashboard();
                });
                actionCell.appendChild(delBtn);
            } else {
                actionCell.textContent = "View Only";
            }
            row.appendChild(actionCell);
            container.appendChild(row);
        });
    }

    const candidateSearch = getElement("candidate-search");
    if (candidateSearch) {
        candidateSearch.addEventListener("input", () => renderCandidates(candidateSearch.value));
    }

    // =========================================
    // 10. QUESTION MANAGEMENT
    // =========================================

    const questionModal = getElement("question-modal");
    const questionForm = getElement("question-form");
    const addQuestionBtn = getElement("add-question");
    const closeQuestionBtn = getElement("close-question-modal");
    const questionCategorySelect = getElement("question-category");

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener("click", () => {
            if (!isSuperAdmin()) {
                alert("Only Super Admin can add questions.");
                return;
            }
            if (questionModal) questionModal.hidden = false;
        });
    }

    if (closeQuestionBtn) {
        closeQuestionBtn.addEventListener("click", () => {
            if (questionModal) questionModal.hidden = true;
        });
    }

    if (questionForm) {
        questionForm.addEventListener("submit", event => {
            event.preventDefault();
            const newQ = {
                id: Date.now(),
                question: getElement("new-question").value.trim(),
                category: getElement("new-category").value,
                answer: getElement("new-answer").value.trim(),
                marks: Number(getElement("new-marks").value) || 1
            };

            db.questions.push(newQ);
            saveDatabase();
            questionForm.reset();
            if (questionModal) questionModal.hidden = true;
            renderQuestions();
            updateDashboard();
        });
    }

    function renderQuestions() {
        const container = getElement("question-list");
        if (!container) return;
        container.replaceChildren();

        const selectedCat = questionCategorySelect ? questionCategorySelect.value : "all";
        const filtered = db.questions.filter(q => selectedCat === "all" || q.category === selectedCat);

        if (filtered.length === 0) {
            container.innerHTML = "<p>No questions found.</p>";
            return;
        }

        filtered.forEach(q => {
            const item = document.createElement("div");
            item.className = "question-item";
            item.innerHTML = `
                <strong>[${q.category.toUpperCase()}]</strong> ${q.question}
                <br><small>Answer: ${q.answer} | Marks: ${q.marks}</small>
            `;
            if (isSuperAdmin()) {
                const delBtn = createButton("Delete", "delete-button", () => {
                    if (!confirm("Delete this question?")) return;
                    db.questions = db.questions.filter(item => item.id !== q.id);
                    saveDatabase();
                    renderQuestions();
                    updateDashboard();
                });
                item.appendChild(delBtn);
            }
            container.appendChild(item);
        });
    }

    if (questionCategorySelect) {
        questionCategorySelect.addEventListener("change", renderQuestions);
    }

    // =========================================
    // 11. EXAMINATION RESULTS & LEADERBOARD
    // =========================================

    function renderResults(search = "") {
        const container = getElement("result-list");
        if (!container) return;
        container.replaceChildren();

        if (db.results.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="7">No examination results available.</td>`;
            container.appendChild(row);
            return;
        }

        db.results.forEach(res => {
            const row = document.createElement("tr");
            const passed = Number(res.marks) >= db.settings.passingMarks;
            row.append(
                createCell(res.name),
                createCell(res.email),
                createCell(res.objectiveMarks || "0"),
                createCell(res.writtenMarks || "0"),
                createCell(res.marks),
                createCell(passed ? "Qualified" : "Not Qualified")
            );
            container.appendChild(row);
        });
    }

    function renderLeaderboard() {
        const container = getElement("leaderboard-list");
        if (!container) return;
        container.replaceChildren();

        const sorted = [...db.results].sort((a, b) => Number(b.marks) - Number(a.marks)).slice(0, 10);

        if (sorted.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="5">Leaderboard is empty.</td>`;
            container.appendChild(row);
            return;
        }

        sorted.forEach((res, index) => {
            const row = document.createElement("tr");
            const percentage = ((Number(res.marks) / 50) * 100).toFixed(1);
            row.append(
                createCell(`#${index + 1}`),
                createCell(res.name),
                createCell(res.school || "N/A"),
                createCell(`${res.marks} / 50`),
                createCell(`${percentage}%`)
            );
            container.appendChild(row);
        });
    }

    // =========================================
    // 12. CERTIFICATES & SETTINGS
    // =========================================

    const certForm = getElement("certificate-form");
    if (certForm) {
        certForm.addEventListener("submit", e => {
            e.preventDefault();
            const name = getElement("certificate-candidate").value;
            const marks = getElement("certificate-marks").value;
            alert(`Certificate generated successfully for ${name} with ${marks} marks!`);
            certForm.reset();
        });
    }

    const settingsForm = getElement("settings-form");
    function loadSettings() {
        setValue("quiz-title", db.settings.title);
        setValue("quiz-duration", db.settings.duration);
        setValue("passing-marks", db.settings.passingMarks);
        setValue("registration-status", db.settings.registrationOpen ? "open" : "closed");
    }

    if (settingsForm) {
        settingsForm.addEventListener("submit", e => {
            e.preventDefault();
            if (!isSuperAdmin()) return;
            db.settings.title = getElement("quiz-title").value;
            db.settings.duration = Number(getElement("quiz-duration").value);
            db.settings.passingMarks = Number(getElement("passing-marks").value);
            db.settings.registrationOpen = getElement("registration-status").value === "open";
            saveDatabase();
            alert("Website settings updated successfully!");
        });
    }

    // =========================================
    // 13. ADMIN MANAGEMENT & REPORTS
    // =========================================

    const createAdminForm = getElement("create-admin-form");
    if (createAdminForm) {
        createAdminForm.addEventListener("submit", e => {
            e.preventDefault();
            if (!isSuperAdmin()) return;
            const newAdmin = {
                name: getElement("new-admin-name").value.trim(),
                email: getElement("new-admin-email").value.trim().toLowerCase(),
                password: getElement("new-admin-password").value,
                role: "exam"
            };
            db.admins.push(newAdmin);
            saveDatabase();
            createAdminForm.reset();
            renderAdmins();
            alert("New exam admin created successfully!");
        });
    }

    function renderAdmins() {
        const container = getElement("admin-list");
        if (!container) return;
        container.replaceChildren();

        const allAdmins = [...DEMO_ADMINS, ...db.admins];
        allAdmins.forEach(adm => {
            const div = document.createElement("div");
            div.className = "question-item";
            div.innerHTML = `<strong>${adm.name}</strong> (${adm.email}) — Role: <em>${adm.role}</em>`;
            container.appendChild(div);
        });
    }

    function updateReports() {
        setText("total-attempts", db.results.length);
        const totalMarks = db.results.reduce((acc, curr) => acc + Number(curr.marks), 0);
        const avg = db.results.length > 0 ? (totalMarks / db.results.length).toFixed(1) : 0;
        setText("average-marks", avg);

        const passing = db.settings.passingMarks;
        const qualifiedCount = db.results.filter(r => Number(r.marks) >= passing).length;
        const passPercent = db.results.length > 0 ? ((qualifiedCount / db.results.length) * 100).toFixed(1) : 0;
        setText("pass-percentage", `${passPercent}%`);
    }

    const logoutBtn = getElement("logout-button");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            currentAdmin = null;
            if (dashboard) dashboard.hidden = true;
            if (loginScreen) loginScreen.hidden = false;
        });
    }
});