const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MOTIVATIONAL_QUOTES = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is the sum of small efforts, repeated day in and day out.",
    "You don’t have to be great to start, but you have to start to be great.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Hard work beats talent when talent doesn’t work hard.",
    "Every accomplishment starts with the decision to try.",
    "Don’t watch the clock; do what it does—keep going."
];

class StudyTracker {
    constructor() {
        this.studyLog = JSON.parse(localStorage.getItem('studyLog')) || [];
        this.breakLog = JSON.parse(localStorage.getItem('breakLog')) || [];
        this.dailyGoal = parseInt(localStorage.getItem('dailyGoal')) || 120;
        this.currentStreak = parseInt(localStorage.getItem('currentStreak')) || 0;
        this.longestStreak = parseInt(localStorage.getItem('longestStreak')) || 0;
        this.theme = localStorage.getItem('theme') || 'light';
        this.subjects = JSON.parse(localStorage.getItem('subjects')) || {};
        this.subjectGoals = JSON.parse(localStorage.getItem('subjectGoals')) || {};
        this.achievements = JSON.parse(localStorage.getItem('achievements')) || {
            '10hours': false,
            '50hours': false,
            '100hours': false,
            'variety': false,
            'daily-grind': false,
            'time-master': false,
        };
        this.rewardCoins = parseInt(localStorage.getItem('rewardCoins')) || 0;
        this.weeklyTimetable = JSON.parse(localStorage.getItem('weeklyTimetable')) || this.getDefaultTimetable();
        this.timetableImages = JSON.parse(localStorage.getItem('timetableImages')) || [];

        this.initializeEventListeners();
        this.initializeDarkMode();
        this.renderAll();
        this.displayMotivationalQuote();
    }

    getDefaultTimetable() {
        const timetable = {};
        DAY_NAMES.forEach(day => timetable[day] = []);
        return timetable;
    }

    initializeEventListeners() {
        document.getElementById('add-session-button').addEventListener('click', () => this.addStudySession());
        document.getElementById('export-csv').addEventListener('click', () => this.exportToCSV());
        document.getElementById('export-pdf').addEventListener('click', () => this.generateWeeklyReport());
        document.getElementById('clear-log').addEventListener('click', () => this.clearLog());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('daily-goal').addEventListener('change', (e) => {
            this.dailyGoal = parseInt(e.target.value) || 120;
            localStorage.setItem('dailyGoal', this.dailyGoal);
            this.updateStats();
        });
        document.getElementById('add-to-timetable').addEventListener('click', () => this.showTimetableModal('add'));
        document.getElementById('save-timetable').addEventListener('click', () => this.saveTimetableSession());
        document.getElementById('cancel-timetable').addEventListener('click', () => this.hideTimetableModal());
        document.getElementById('timetable-image-upload').addEventListener('change', (event) => this.uploadTimetableImages(event));
        document.getElementById('image-section-header').addEventListener('click', () => this.toggleImageSection());
        document.getElementById('analysis-card').addEventListener('click', () => this.showAnalysisModal());
        document.getElementById('close-analysis-modal').addEventListener('click', () => this.hideAnalysisModal());
    }

    initializeDarkMode() {
        if (this.theme === 'dark') document.documentElement.classList.add('dark');
        this.updateThemeIcon();
    }

    toggleDarkMode() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.classList.toggle('dark');
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const themeIcon = document.getElementById('theme-icon');
        themeIcon.innerHTML = this.theme === 'dark'
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
    }

    addStudySession() {
        const subject = document.getElementById('subject-name').value.trim();
        const date = document.getElementById('session-date').value;
        const type = document.getElementById('session-type').value;
        const hours = parseInt(document.getElementById('duration-hours').value) || 0;
        const minutes = parseInt(document.getElementById('duration-minutes').value) || 0;
        const breakHours = parseInt(document.getElementById('break-hours').value) || 0;
        const breakMinutes = parseInt(document.getElementById('break-minutes').value) || 0;
        const notes = document.getElementById('session-notes').value.trim();
        const duration = hours * 60 + minutes;
        const breakDuration = breakHours * 60 + breakMinutes;
        const color = document.getElementById('subject-color').value;

        if (!subject || !date || duration <= 0) {
            alert('Please fill in all fields correctly for study session.');
            return;
        }

        this.subjects[subject] = color;
        localStorage.setItem('subjects', JSON.stringify(this.subjects));

        const session = { subject, date, type, duration, color, notes };
        this.studyLog.push(session);
        if (breakDuration > 0) {
            this.breakLog.push({ date, duration: breakDuration });
            localStorage.setItem('breakLog', JSON.stringify(this.breakLog));
        }
        this.saveStudyLog();
        this.updateStreak(date);
        this.updateRewardCoins();

        this.renderAll();
        this.clearInputs();
        this.showSessionAddedMessage();
        this.updateAchievements();
        this.updateAchievementsDisplay();
        this.displayMotivationalQuote();
    }

    showSessionAddedMessage() {
        const message = document.getElementById('session-added-message');
        message.classList.add('show');
        setTimeout(() => message.classList.remove('show'), 3000);
    }

    updateStreak(date) {
        const today = new Date(date);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const lastSession = this.studyLog[this.studyLog.length - 2];
        const lastSessionDate = lastSession ? new Date(lastSession.date) : null;

        if (lastSessionDate && lastSessionDate.toDateString() === yesterday.toDateString()) {
            this.currentStreak++;
        } else if (!lastSessionDate || lastSessionDate.toDateString() !== today.toDateString()) {
            this.currentStreak = 1;
        }

        this.longestStreak = Math.max(this.currentStreak, this.longestStreak);
        localStorage.setItem('currentStreak', this.currentStreak);
        localStorage.setItem('longestStreak', this.longestStreak);
    }

    updateRewardCoins() {
        this.rewardCoins += this.currentStreak * 10; // 10 coins per streak day
        localStorage.setItem('rewardCoins', this.rewardCoins);
        document.getElementById('reward-coins').textContent = this.rewardCoins;
    }

    displayMotivationalQuote() {
        const quoteElement = document.getElementById('motivational-quote');
        const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        quoteElement.textContent = `"${randomQuote}"`;
    }

    renderAll() {
        this.renderStudyLog();
        this.renderTimetable();
        this.updateStats();
        this.renderSubjectProgress();
        this.updateAchievementsDisplay();
        this.renderImagePreviews();
        this.renderDetailedAnalysis();
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    renderStudyLog() {
        const logContainer = document.getElementById('study-log');
        logContainer.innerHTML = '';

        const groupedByDate = {};
        this.studyLog.forEach((session, index) => {
            if (!groupedByDate[session.date]) groupedByDate[session.date] = [];
            groupedByDate[session.date].push({ ...session, originalIndex: index });
        });

        Object.keys(groupedByDate).sort().reverse().forEach(date => {
            const dateElement = document.createElement('div');
            dateElement.className = 'study-log-date';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'collapsible-header';
            const totalDuration = groupedByDate[date].reduce((sum, s) => sum + s.duration, 0);
            dateHeader.innerHTML = `
                <span>${date}</span>
                <span>${this.formatDuration(totalDuration)}</span>
                <i class="fas fa-chevron-down"></i>
            `;

            const sessionList = document.createElement('div');
            sessionList.className = 'collapsible-content';
            sessionList.style.maxHeight = '0px';

            groupedByDate[date].forEach(session => {
                const sessionElement = document.createElement('div');
                sessionElement.className = 'study-log-session';
                sessionElement.style.borderLeftColor = session.color || '#6366f1';
                sessionElement.innerHTML = `
                    <div>
                        <span>${session.subject}</span>
                        <span>${this.formatDuration(session.duration)}</span>
                        ${session.notes ? `<div class="notes-text">${session.notes}</div>` : ''}
                    </div>
                    <div class="session-actions">
                        <button onclick="window.studyTracker.editStudySession(${session.originalIndex})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="window.studyTracker.deleteStudySession(${session.originalIndex})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                sessionList.appendChild(sessionElement);
            });

            dateHeader.addEventListener('click', () => {
                const icon = dateHeader.querySelector('i');
                if (sessionList.style.maxHeight === '0px') {
                    sessionList.style.maxHeight = sessionList.scrollHeight + 'px';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    sessionList.style.maxHeight = '0px';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });

            dateElement.appendChild(dateHeader);
            dateElement.appendChild(sessionList);
            logContainer.appendChild(dateElement);
        });
    }

    renderTimetable() {
        const timetableContainer = document.getElementById('weekly-timetable');
        timetableContainer.innerHTML = '';

        let totalWeeklyMinutes = 0;

        DAY_NAMES.forEach(day => {
            const daySessions = this.weeklyTimetable[day] || [];
            const dayTotalMinutes = daySessions.reduce((sum, session) => sum + session.duration, 0);
            totalWeeklyMinutes += dayTotalMinutes;

            const dayElement = document.createElement('div');
            dayElement.className = 'timetable-day';

            const dayHeader = document.createElement('div');
            dayHeader.className = 'collapsible-header';
            dayHeader.innerHTML = `
                <span>${day}</span>
                <span>${this.formatDuration(dayTotalMinutes)}</span>
                <i class="fas fa-chevron-down"></i>
            `;

            const sessionList = document.createElement('div');
            sessionList.className = 'collapsible-content';
            sessionList.style.maxHeight = '0px';

            if (daySessions.length > 0) {
                daySessions.forEach((session, index) => {
                    const sessionElement = document.createElement('div');
                    sessionElement.className = 'timetable-session';
                    sessionElement.style.borderLeftColor = session.color || '#6366f1';
                    sessionElement.innerHTML = `
                        <span>${session.subject}</span>
                        <span>${this.formatDuration(session.duration)}</span>
                        <div class="session-actions">
                            <button onclick="window.studyTracker.showTimetableModal('edit', '${day}', ${index})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button onclick="window.studyTracker.deleteTimetableSession('${day}', ${index})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `;
                    sessionList.appendChild(sessionElement);
                });
            } else {
                const emptyElement = document.createElement('div');
                emptyElement.className = 'text-sm text-gray-500 dark:text-gray-400 italic';
                emptyElement.textContent = 'No sessions planned';
                sessionList.appendChild(emptyElement);
            }

            dayHeader.addEventListener('click', () => {
                const icon = dayHeader.querySelector('i');
                if (sessionList.style.maxHeight === '0px') {
                    sessionList.style.maxHeight = sessionList.scrollHeight + 'px';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    sessionList.style.maxHeight = '0px';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });

            dayElement.appendChild(dayHeader);
            dayElement.appendChild(sessionList);
            timetableContainer.appendChild(dayElement);
        });

        document.getElementById('weekly-plan-duration').textContent = this.formatDuration(totalWeeklyMinutes);
    }

    updateStats() {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const todayStudy = this.studyLog.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.duration, 0);
        const todayBreak = this.breakLog.filter(b => b.date === todayStr).reduce((sum, b) => sum + b.duration, 0);
        document.getElementById('today-summary').textContent = this.formatDuration(todayStudy);
        document.getElementById('today-break-summary').textContent = this.formatDuration(todayBreak);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        const weekStudy = this.studyLog.filter(s => s.date >= weekStartStr).reduce((sum, s) => sum + s.duration, 0);
        const weekBreak = this.breakLog.filter(b => b.date >= weekStartStr).reduce((sum, b) => sum + b.duration, 0);
        document.getElementById('week-summary').textContent = this.formatDuration(weekStudy);
        document.getElementById('week-break-summary').textContent = this.formatDuration(weekBreak);

        const progressPercentage = Math.min(100, Math.round((todayStudy / this.dailyGoal) * 100));
        document.getElementById('goal-progress-text').textContent = `${progressPercentage}%`;
        const progressBar = document.getElementById('goal-progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.classList.remove('bg-indigo-600', 'bg-purple-600', 'bg-green-500');
        if (progressPercentage >= 100) progressBar.classList.add('bg-green-500');
        else if (progressPercentage >= 50) progressBar.classList.add('bg-purple-600');
        else progressBar.classList.add('bg-indigo-600');

        const ratio = weekStudy > 0 ? Math.round((weekStudy / (weekStudy + weekBreak)) * 100) : 0;
        document.getElementById('study-break-ratio').textContent = `${ratio}%`;
    }

    renderSubjectProgress() {
        const container = document.getElementById('subject-progress');
        container.innerHTML = '';

        const subjectTotals = {};
        this.studyLog.forEach(session => {
            if (!subjectTotals[session.subject]) {
                subjectTotals[session.subject] = { duration: 0, color: session.color };
            }
            subjectTotals[session.subject].duration += session.duration;
        });

        Object.entries(subjectTotals).forEach(([subject, { duration, color }]) => {
            const progressItem = document.createElement('div');
            progressItem.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${subject}</span>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${this.formatDuration(duration)}</span>
                </div>
            `;
            container.appendChild(progressItem);
        });
    }

    updateAchievements() {
        const totalStudyHours = this.studyLog.reduce((sum, s) => sum + s.duration, 0) / 60;
        const uniqueSubjects = new Set(this.studyLog.map(s => s.subject)).size;
        const last7Days = Array(7).fill().map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        });
        const dailyGoalMet = last7Days.every(date => {
            const dailyStudy = this.studyLog.filter(s => s.date === date).reduce((sum, s) => sum + s.duration, 0);
            return dailyStudy >= this.dailyGoal;
        });

        this.achievements['10hours'] = totalStudyHours >= 10;
        this.achievements['50hours'] = totalStudyHours >= 50;
        this.achievements['100hours'] = totalStudyHours >= 100;
        this.achievements['variety'] = uniqueSubjects >= 3;
        this.achievements['daily-grind'] = dailyGoalMet;
        this.achievements['time-master'] = this.studyLog.length >= 5;

        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    updateAchievementsDisplay() {
        const container = document.getElementById('achievements-container');
        container.innerHTML = `
            <div class="achievement-badge">
                <span class="achievement-icon">🔥</span>
                <span class="achievement-label">Current Streak</span>
                <span class="font-semibold text-gray-700 dark:text-gray-300">${this.currentStreak} days</span>
            </div>
            <div class="achievement-badge">
                <span class="achievement-icon">🏆</span>
                <span class="achievement-label">Longest Streak</span>
                <span class="font-semibold text-gray-700 dark:text-gray-300">${this.longestStreak} days</span>
            </div>
            <div class="achievement-badge ${this.achievements['10hours'] ? 'achievement-unlocked' : 'achievement-locked'}">
                <span class="achievement-icon"><i class="fas fa-graduation-cap"></i></span>
                <span class="achievement-label">10 Hours</span>
            </div>
            <div class="achievement-badge ${this.achievements['50hours'] ? 'achievement-unlocked' : 'achievement-locked'}">
                <span class="achievement-icon"><i class="fas fa-book-reader"></i></span>
                <span class="achievement-label">50 Hours</span>
            </div>
            <div class="achievement-badge ${this.achievements['100hours'] ? 'achievement-unlocked' : 'achievement-locked'}">
                <span class="achievement-icon"><i class="fas fa-book-open"></i></span>
                <span class="achievement-label">100 Hours</span>
            </div>
            <div class="achievement-badge ${this.achievements['variety'] ? 'achievement-unlocked' : 'achievement-locked'}">
                <span class="achievement-icon"><i class="fas fa-compass"></i></span>
                <span class="achievement-label">Variety</span>
            </div>
            <div class="achievement-badge ${this.achievements['daily-grind'] ? 'achievement-unlocked' : 'achievement-locked'}">
                <span class="achievement-icon"><i class="fas fa-calendar-check"></i></span>
                <span class="achievement-label">Daily Grind</span>
            </div>
            <div class="achievement-badge ${this.achievements['time-master'] ? 'achievement-unlocked' : 'achievement-locked'}">
                <span class="achievement-icon"><i class="fas fa-clock"></i></span>
                <span class="achievement-label">Time Master</span>
            </div>
        `;

        Object.keys(this.achievements).forEach(key => {
            if (this.achievements[key] && !localStorage.getItem(`celebrated_${key}`)) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                localStorage.setItem(`celebrated_${key}`, 'true');
            }
        });

        document.getElementById('reward-coins').textContent = this.rewardCoins;
    }

    showTimetableModal(mode, day = null, index = null) {
        const modal = document.getElementById('timetable-modal');
        const title = document.getElementById('timetable-modal-title');
        const editModeInput = document.getElementById('timetable-edit-mode');
        const sessionIndexInput = document.getElementById('timetable-session-index');
        const daysSelect = document.getElementById('timetable-days');

        if (mode === 'edit') {
            title.textContent = 'Edit Timetable Session';
            editModeInput.value = 'edit';
            sessionIndexInput.value = index;
            const session = this.weeklyTimetable[day][index];
            Array.from(daysSelect.options).forEach(option => option.selected = option.value === day);
            document.getElementById('timetable-subject').value = session.subject;
            document.getElementById('timetable-duration').value = session.duration;
            document.getElementById('timetable-color').value = session.color;
        } else {
            title.textContent = 'Add to Timetable';
            editModeInput.value = 'add';
            sessionIndexInput.value = '';
            Array.from(daysSelect.options).forEach(option => option.selected = false);
            document.getElementById('timetable-subject').value = '';
            document.getElementById('timetable-duration').value = '';
            document.getElementById('timetable-color').value = '#6366f1';
        }
        modal.classList.remove('hidden');
    }

    hideTimetableModal() {
        document.getElementById('timetable-modal').classList.add('hidden');
    }

    saveTimetableSession() {
        const days = Array.from(document.getElementById('timetable-days').selectedOptions).map(option => option.value);
        const subject = document.getElementById('timetable-subject').value.trim();
        const duration = parseInt(document.getElementById('timetable-duration').value) || 0;
        const color = document.getElementById('timetable-color').value;
        const editMode = document.getElementById('timetable-edit-mode').value;
        const sessionIndex = document.getElementById('timetable-session-index').value;

        if (!subject || duration <= 0 || days.length === 0) {
            alert('Please fill in all fields correctly and select at least one day.');
            return;
        }

        this.subjects[subject] = color;
        localStorage.setItem('subjects', JSON.stringify(this.subjects));

        const session = { subject, duration, color, type: 'planned' };

        if (editMode === 'edit' && sessionIndex !== '') {
            const oldDay = Object.keys(this.weeklyTimetable).find(day => this.weeklyTimetable[day][sessionIndex]);
            this.weeklyTimetable[oldDay].splice(sessionIndex, 1);
        }

        days.forEach(day => {
            session.date = this.getNextDateForDay(day).toISOString().split('T')[0];
            this.weeklyTimetable[day].push({ ...session });
        });


        localStorage.setItem('weeklyTimetable', JSON.stringify(this.weeklyTimetable));
        this.hideTimetableModal();
        this.renderTimetable();
    }

    getNextDateForDay(dayName) {
        const dayIndex = DAY_NAMES.indexOf(dayName);
        const today = new Date();
        const daysToAdd = (dayIndex - today.getDay() + 7) % 7 || 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysToAdd);
        return nextDate;
    }


    deleteTimetableSession(day, index) {
        if (confirm('Are you sure you want to delete this timetable session?')) {
            this.weeklyTimetable[day].splice(index, 1);
            localStorage.setItem('weeklyTimetable', JSON.stringify(this.weeklyTimetable));
            this.renderTimetable();
        }
    }

    showAnalysisModal() {
        const modal = document.getElementById('analysis-modal');
        modal.style.display = 'block';
        this.renderDetailedAnalysis();
    }

    hideAnalysisModal() {
        const modal = document.getElementById('analysis-modal');
        modal.style.display = 'none';
    }

    renderDetailedAnalysis() {
        const container = document.getElementById('detailed-analysis');
        container.innerHTML = '';

        // Subject Breakdown Section
        const subjectSection = document.createElement('div');
        subjectSection.className = 'mb-6';
        const subjectHeader = document.createElement('div');
        subjectHeader.className = 'collapsible-header';
        const totalStudy = this.studyLog.reduce((sum, s) => sum + s.duration, 0);
        subjectHeader.innerHTML = `
            <span>Subject Breakdown</span>
            <span>Total: ${this.formatDuration(totalStudy)}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        const subjectContent = document.createElement('div');
        subjectContent.className = 'collapsible-content';
        subjectContent.style.maxHeight = '0px';

        const subjectTotals = {};
        this.studyLog.forEach(session => {
            subjectTotals[session.subject] = (subjectTotals[session.subject] || { duration: 0, color: session.color, dates: {} });
            subjectTotals[session.subject].duration += session.duration;
            if (!subjectTotals[session.subject].dates[session.date]) subjectTotals[session.subject].dates[session.date] = [];
            subjectTotals[session.subject].dates[session.date].push(session);
        });

        Object.entries(subjectTotals).forEach(([subject, { duration, color, dates }]) => {
            const subjectItem = document.createElement('div');
            subjectItem.className = 'subject-breakdown-item mb-2';

            const subjectSubHeader = document.createElement('div');
            subjectSubHeader.className = 'collapsible-header';
            subjectSubHeader.innerHTML = `
                <span class="flex items-center"><span class="subject-color-dot" style="background-color: ${color || '#6366f1'}"></span>${subject}</span>
                <i class="fas fa-chevron-down"></i>
            `;

            const dateList = document.createElement('div');
            dateList.className = 'collapsible-content';
            dateList.style.maxHeight = '0px';

            Object.keys(dates).sort().reverse().forEach(date => {
                const dateItem = document.createElement('div');
                dateItem.className = 'analysis-session';
                const dateTotal = dates[date].reduce((sum, s) => sum + s.duration, 0);
                dateItem.innerHTML = `<span class="mr-4">${date}</span><span>${this.formatDuration(dateTotal)}</span>`;
                dateList.appendChild(dateItem);
            });

            subjectSubHeader.addEventListener('click', () => {
                const icon = subjectSubHeader.querySelector('i');
                if (dateList.style.maxHeight === '0px') {
                    dateList.style.maxHeight = dateList.scrollHeight + 'px';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    dateList.style.maxHeight = '0px';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });

            subjectItem.appendChild(subjectSubHeader);
            subjectItem.appendChild(dateList);
            subjectContent.appendChild(subjectItem);
        });

        subjectHeader.addEventListener('click', () => {
            const icon = subjectHeader.querySelector('i');
            if (subjectContent.style.maxHeight === '0px') {
                subjectContent.style.maxHeight = subjectContent.scrollHeight + 'px';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                subjectContent.style.maxHeight = '0px';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });

        subjectSection.appendChild(subjectHeader);
        subjectSection.appendChild(subjectContent);
        container.appendChild(subjectSection);

        // Breaks Section
        const breakSection = document.createElement('div');
        breakSection.className = 'mb-6';
        const breakHeader = document.createElement('div');
        breakHeader.className = 'collapsible-header';
        const totalBreak = this.breakLog.reduce((sum, b) => sum + b.duration, 0);
        breakHeader.innerHTML = `
            <span>Break Analysis</span>
            <span>Total: ${this.formatDuration(totalBreak)}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        const breakContent = document.createElement('div');
        breakContent.className = 'collapsible-content';
        breakContent.style.maxHeight = '0px';

        const breakByDate = {};
        this.breakLog.forEach(entry => {
            if (!breakByDate[entry.date]) breakByDate[entry.date] = [];
            breakByDate[entry.date].push(entry);
        });

        Object.keys(breakByDate).sort().reverse().forEach(date => {
            const breakItem = document.createElement('div');
            breakItem.className = 'break-item mb-2';

            const breakSubHeader = document.createElement('div');
            breakSubHeader.className = 'collapsible-header';
            const dateTotal = breakByDate[date].reduce((sum, b) => sum + b.duration, 0);
            breakSubHeader.innerHTML = `
                <span>${date}</span>
                <span>${this.formatDuration(dateTotal)}</span>
                <i class="fas fa-chevron-down"></i>
            `;

            const breakList = document.createElement('div');
            breakList.className = 'collapsible-content';
            breakList.style.maxHeight = '0px';

            breakByDate[date].forEach((b, index) => {
                const breakDetail = document.createElement('div');
                breakDetail.className = 'analysis-session';
                breakDetail.innerHTML = `<span class="mr-4">Break ${index + 1}</span><span>${this.formatDuration(b.duration)}</span>`;
                breakList.appendChild(breakDetail);
            });

            breakSubHeader.addEventListener('click', () => {
                const icon = breakSubHeader.querySelector('i');
                if (breakList.style.maxHeight === '0px') {
                    breakList.style.maxHeight = breakList.scrollHeight + 'px';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    breakList.style.maxHeight = '0px';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });

            breakItem.appendChild(breakSubHeader);
            breakItem.appendChild(breakList);
            breakContent.appendChild(breakItem);
        });

        breakHeader.addEventListener('click', () => {
            const icon = breakHeader.querySelector('i');
            if (breakContent.style.maxHeight === '0px') {
                breakContent.style.maxHeight = breakContent.scrollHeight + 'px';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                breakContent.style.maxHeight = '0px';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });

        breakSection.appendChild(breakHeader);
        breakSection.appendChild(breakContent);
        container.appendChild(breakSection);
    }


    toggleImageSection() {
        const content = document.getElementById('image-section-content');
        const icon = document.getElementById('image-section-header').querySelector('i');
        if (content.style.maxHeight === '0px') {
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            content.style.maxHeight = '0px';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    uploadTimetableImages(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.timetableImages.push(e.target.result);
                localStorage.setItem('timetableImages', JSON.stringify(this.timetableImages));
                this.renderImagePreviews();
            };
            reader.readAsDataURL(file);
        });
    }

    renderImagePreviews() {
        const container = document.getElementById('timetable-image-preview-container');
        container.innerHTML = '';
        this.timetableImages.forEach((imageSrc, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img class="image-preview" src="${imageSrc}" alt="Uploaded Image">
                <button class="remove-image-btn" onclick="window.studyTracker.removeTimetableImage(${index})">×</button>
            `;
            previewItem.querySelector('.image-preview').addEventListener('click', () => {
                const modal = document.getElementById('image-modal');
                document.getElementById('modal-image').src = imageSrc;
                modal.style.display = 'block';
                document.getElementById('close-modal').addEventListener('click', () => modal.style.display = 'none');
            });
            container.appendChild(previewItem);
        });
    }

    removeTimetableImage(index) {
        if (confirm('Are you sure you want to remove this image?')) {
            this.timetableImages.splice(index, 1);
            localStorage.setItem('timetableImages', JSON.stringify(this.timetableImages));
            this.renderImagePreviews();
        }
    }


    editStudySession(index) {
        // This is a placeholder. You would implement the edit logic here.
        // For example, populate the input form with the session data and change the button action.
        alert('Edit functionality is not fully implemented in this version.');
        // Example (partial):
        // const session = this.studyLog[index];
        // document.getElementById('subject-name').value = session.subject;
        // document.getElementById('session-date').value = session.date;
        // ... populate other fields ...
        // Change button text and behavior to "Update Session"
    }

    deleteStudySession(index) {
        if (confirm('Are you sure you want to delete this study session?')) {
            this.studyLog.splice(index, 1);
            this.saveStudyLog();
            this.renderAll();
            this.updateAchievements();
            this.updateAchievementsDisplay();
        }
    }

    exportToCSV() {
        const csv = XLSX.utils.json_to_sheet(this.studyLog.map(s => ({
            Date: s.date,
            Subject: s.subject,
            Duration: this.formatDuration(s.duration),
            Type: s.type,
            Notes: s.notes
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, csv, 'StudyLog');
        XLSX.writeFile(workbook, 'study_log.csv');
    }

    generateWeeklyReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Weekly Study Report', 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        const weekStudy = this.studyLog.filter(s => s.date >= weekStartStr);
        const weekBreak = this.breakLog.filter(b => b.date >= weekStartStr);
        const totalStudy = weekStudy.reduce((sum, s) => sum + s.duration, 0);
        const totalBreak = weekBreak.reduce((sum, b) => sum + b.duration, 0);


        doc.text(`Total Study Time: ${this.formatDuration(totalStudy)}`, 14, 40);
        doc.text(`Total Break Time: ${this.formatDuration(totalBreak)}`, 14, 50);
        doc.text(`Current Streak: ${this.currentStreak} days`, 14, 60);
        doc.text(`Longest Streak: ${this.longestStreak} days`, 14, 70);
        doc.text(`Reward Coins: ${this.rewardCoins}`, 14, 80);


        const tableData = weekStudy.map(s => [s.date, s.subject, this.formatDuration(s.duration), s.type, s.notes || '']);
        doc.autoTable({
            startY: 90,
            head: [['Date', 'Subject', 'Duration', 'Type', 'Notes']],
            body: tableData,
        });

        doc.save('weekly_study_report.pdf');
    }

    clearLog() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.studyLog = [];
            this.breakLog = [];
            this.currentStreak = 0;
            this.longestStreak = 0;
            this.rewardCoins = 0;
            this.weeklyTimetable = this.getDefaultTimetable();
            this.timetableImages = [];
            this.achievements = {
                '10hours': false,
                '50hours': false,
                '100hours': false,
                'variety': false,
                'daily-grind': false,
                'time-master': false,
            };
            // Clear everything except potentially the theme and daily goal if you want them persistent across clears
            const currentTheme = localStorage.getItem('theme');
            const currentDailyGoal = localStorage.getItem('dailyGoal');
            localStorage.clear();
            if (currentTheme) localStorage.setItem('theme', currentTheme);
            if (currentDailyGoal) localStorage.setItem('dailyGoal', currentDailyGoal);

            this.renderAll();
            this.updateAchievementsDisplay(); // Ensure achievements display is updated
            document.getElementById('reward-coins').textContent = this.rewardCoins; // Update coin display
        }
    }


    saveStudyLog() {
        localStorage.setItem('studyLog', JSON.stringify(this.studyLog));
    }

    clearInputs() {
        document.getElementById('subject-name').value = '';
        document.getElementById('session-date').value = '';
        document.getElementById('duration-hours').value = '';
        document.getElementById('duration-minutes').value = '';
        document.getElementById('break-hours').value = '';
        document.getElementById('break-minutes').value = '';
        document.getElementById('session-notes').value = '';
        document.getElementById('subject-color').value = '#6366f1';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.studyTracker = new StudyTracker();
});