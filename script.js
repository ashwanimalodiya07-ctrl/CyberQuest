/* CyberQuest Quiz - script.js
   Works with CyberQuest_regenerated.html.
   Objective auto-marking is provided for MCQs and True/False.
   Fill-in-the-blanks, full forms and short answers need manual review.
*/
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("answersheet");
    if (!form) return;

    const totalQuestions = 45;
    const quizDuration = 60 * 60;
    const timerEl = document.getElementById("timer");
    const progressBar = document.getElementById("progress-bar");
    const progressContainer = document.getElementById("progress-container");
    const counterEl = document.getElementById("question-counter");
    const resultSection = document.getElementById("result");
    const resultMessage = document.getElementById("result-message");
    const submitButton = document.getElementById("submit-quiz");
    const storageKey = "cyberquest_answers_v1";
    let remainingSeconds = quizDuration;
    let submitted = false;
    let timerId = null;

    // Correct answers for the 10 MCQs and 10 True/False questions.
    const answerKey = {
        mcq1: "PAN",
        mcq2: "Virtual Private Network",
        mcq3: "Prevent unauthorized access",
        mcq4: "Artificial Intelligence",
        mcq5: "Queue",
        mcq6: "Creating virtual versions of resources",
        mcq7: "Network",
        mcq8: "SQL",
        mcq9: "Fraudulent attempt to obtain sensitive information",
        mcq10: "Converts domain names to IP addresses",
        tf1: "false",
        tf2: "true",
        tf3: "true",
        tf4: "false",
        tf5: "true",
        tf6: "true",
        tf7: "false",
        tf8: "true",
        tf9: "true",
        tf10: "false"
    };

    function getQuestionNames() {
        const names = [];
        for (let i = 1; i <= 10; i++) {
            names.push(`mcq${i}`, `fill${i}`, `tf${i}`, `fullform${i}`);
        }
        for (let i = 1; i <= 5; i++) names.push(`short${i}`);
        return names;
    }

    const questionNames = getQuestionNames();

    function isAnswered(name) {
        const controls = [...form.querySelectorAll(`[name="${name}"]`)];
        if (!controls.length) return false;
        if (controls[0].type === "radio") {
            return controls.some(control => control.checked);
        }
        return controls.some(control => control.value.trim() !== "");
    }

    function updateProgress() {
        const answered = questionNames.filter(isAnswered).length;
        const percentage = (answered / totalQuestions) * 100;

        if (counterEl) {
            counterEl.textContent = `Questions Answered: ${answered} / ${totalQuestions}`;
        }
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressContainer) {
            progressContainer.setAttribute("aria-valuenow", String(answered));
        }
    }

    function saveAnswers() {
        const data = {};
        form.querySelectorAll("input, textarea, select").forEach(control => {
            if (!control.name || control.type === "submit" || control.type === "button") return;
            if (control.type === "radio") {
                if (control.checked) data[control.name] = control.value;
            } else if (control.type === "checkbox") {
                if (!data[control.name]) data[control.name] = [];
                if (control.checked) data[control.name].push(control.value);
            } else {
                data[control.name] = control.value;
            }
        });
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn("Could not save quiz progress in this browser.", error);
        }
    }

    function restoreAnswers() {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
            Object.entries(saved).forEach(([name, value]) => {
                const controls = [...form.querySelectorAll(`[name="${name}"]`)];
                controls.forEach(control => {
                    if (control.type === "radio") {
                        control.checked = control.value === value;
                    } else if (control.type === "checkbox") {
                        control.checked = Array.isArray(value) && value.includes(control.value);
                    } else {
                        control.value = value;
                    }
                });
            });
        } catch (error) {
            console.warn("Could not restore saved quiz progress.", error);
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function updateTimer() {
        if (!timerEl) return;
        timerEl.textContent = `Time Left: ${formatTime(remainingSeconds)}`;
        if (remainingSeconds <= 300) timerEl.classList.add("time-warning");
        if (remainingSeconds <= 0) {
            clearInterval(timerId);
            submitQuiz(true);
            return;
        }
        remainingSeconds--;
    }

    function calculateObjectiveScore() {
        let correct = 0;
        let attempted = 0;
        Object.entries(answerKey).forEach(([name, answer]) => {
            const selected = form.querySelector(`[name="${name}"]:checked`);
            if (selected) {
                attempted++;
                if (selected.value === answer) correct++;
            }
        });
        return { correct, attempted };
    }

    function submitQuiz(timeUp = false) {
        if (submitted) return;
        if (!timeUp && !form.reportValidity()) return;

        submitted = true;
        clearInterval(timerId);
        saveAnswers();

        const { correct, attempted } = calculateObjectiveScore();
        
        // Collect candidate data
        const candidateData = {
            name: form.querySelector('[name="name"]')?.value || "Anonymous",
            email: form.querySelector('[name="email"]')?.value || "N/A",
            school: form.querySelector('[name="school"]')?.value || "N/A",
            score: correct
        };

        // Send to backend server
        fetch("http://localhost:5000/api/submit-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidateData)
        })
        .then(res => res.json())
        .then(data => console.log("Saved to server:", data))
        .catch(err => console.error("Server error:", err));

        const manualQuestions = 25; // 10 fill blanks + 10 full forms + 5 short answers
        if (resultSection) resultSection.hidden = false;

        if (resultMessage) {
            resultMessage.innerHTML = `
                <strong>${timeUp ? "Time is up! " : "Quiz submitted successfully! "}</strong><br>
                Objective questions attempted: ${attempted} / 20<br>
                Correct objective answers: ${correct} / 20<br>
                Objective score: ${correct} / 20 marks<br>
                ${manualQuestions} written-answer questions require manual checking.<br>
                <em>Final score out of 50 will be available after the written answers are evaluated.</em>
            `;
        }

        // Show Certificate Modal and populate data
        const certModal = document.getElementById("certificate-modal");
        const certName = document.getElementById("cert-name");
        const certScore = document.getElementById("cert-score");
        
        if (certModal && certName && certScore) {
            certName.textContent = candidateData.name;
            certScore.textContent = correct;
            certModal.style.display = "block";
        }

        form.querySelectorAll("input, textarea, button").forEach(control => {
            control.disabled = true;
        });
        if (submitButton) submitButton.textContent = "Submitted";
        resultSection?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    restoreAnswers();
    updateProgress();

    form.addEventListener("input", () => {
        updateProgress();
        saveAnswers();
    });
    form.addEventListener("change", () => {
        updateProgress();
        saveAnswers();
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        submitQuiz(false);
    });

    // Start the 60-minute countdown.
    updateTimer();
    timerId = setInterval(updateTimer, 1000);
});