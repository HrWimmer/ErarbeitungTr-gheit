// progress-tracker.js

const ProgressTracker = {
    studentId: null,
    studentName: null,
    moduleId: null,
    progress: {},

    init(moduleId) {
        this.moduleId = moduleId;
        this.loadOrCreateSession();
        this.setupKeyboardShortcut();
        this.syncProgressWithDatabase();
    },

    loadOrCreateSession() {
        // Generiere eine zufällige ID für den Schüler, falls noch keine vorhanden ist
        let id = localStorage.getItem('pt_student_id');
        if (!id) {
            id = 'S_' + Math.random().toString(36).substring(2, 9).toUpperCase();
            localStorage.setItem('pt_student_id', id);
        }
        this.studentId = id;

        // Name laden oder anfragen
        let name = localStorage.getItem('pt_student_name');
        if (!name) {
            name = 'Anonym (' + id + ')';
            localStorage.setItem('pt_student_name', name);
        }
        this.studentName = name;
    },

    setStudentName(newName) {
        if (newName && newName.trim()) {
            this.studentName = newName.trim();
            localStorage.setItem('pt_student_name', this.studentName);
            this.saveProgress();
        }
    },

    // Aktualisiert den Fortschritt einer bestimmten Aufgabe (taskId z.B. 'sim', 'quiz1')
    // state: true für gelöst, false für offen
    updateTask(taskId, solved = true) {
        this.progress[taskId] = solved;
        localStorage.setItem(`pt_progress_${this.moduleId}`, JSON.stringify(this.progress));
        this.saveProgress();
        
        // Trigger event, falls die UI reagieren soll
        window.dispatchEvent(new CustomEvent('progress-changed', { detail: this.progress }));
    },

    isSolved(taskId) {
        // Wenn das Modul per Passwort freigeschaltet ist, gilt jede Aufgabe als gelöst
        if (this.isPasswordUnlocked()) return true;
        return !!this.progress[taskId];
    },

    async saveProgress() {
        const solvedCount = Object.values(this.progress).filter(Boolean).length;
        const totalTasks = window.TOTAL_TASKS || 5; // Fallback
        const percent = Math.min(100, Math.round((solvedCount / totalTasks) * 100));

        const data = {
            studentId: this.studentId,
            studentName: this.studentName,
            moduleId: this.moduleId,
            progress: this.progress,
            percent: percent,
            lastActive: new Date().toISOString()
        };

        try {
            // Speichere in Firestore (oder LocalStorage im Mock-Modus)
            await db.collection('progress').doc(`${this.studentId}_${this.moduleId}`).set(data, { merge: true });
        } catch (e) {
            console.error("Fehler beim Speichern des Fortschritts:", e);
        }
    },

    syncProgressWithDatabase() {
        // Lokalen Fortschritt laden
        const local = localStorage.getItem(`pt_progress_${this.moduleId}`);
        if (local) {
            this.progress = JSON.parse(local);
        }

        // Live-Sync aus der Datenbank (falls online)
        db.collection('progress').doc(`${this.studentId}_${this.moduleId}`).onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data && data.progress) {
                    this.progress = data.progress;
                    localStorage.setItem(`pt_progress_${this.moduleId}`, JSON.stringify(this.progress));
                    window.dispatchEvent(new CustomEvent('progress-changed', { detail: this.progress }));
                }
            }
        });
    },

    // --- Geheimcode: Strg+Shift+Enter ---
    setupKeyboardShortcut() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                console.log("Geheimcode ausgelöst: Aufgabe überspringen!");
                window.dispatchEvent(new CustomEvent('bypass-task'));
            }
        });
    },

    // --- Passwort-Schutz / Bypass-Modus ---
    isPasswordUnlocked() {
        return localStorage.getItem(`pt_unlocked_${this.moduleId}`) === 'true';
    },

    unlockWithPassword() {
        localStorage.setItem(`pt_unlocked_${this.moduleId}`, 'true');
        window.dispatchEvent(new CustomEvent('module-unlocked'));
    },

    lockModule() {
        localStorage.removeItem(`pt_unlocked_${this.moduleId}`);
    },

    // Vergleicht das eingegebene Passwort mit dem in Firestore gespeicherten
    async checkGlobalPassword(enteredPassword) {
        try {
            const doc = await db.collection('passwords').doc('mechanik').get();
            if (doc.exists) {
                const data = doc.data();
                if (data && data.password && data.password.trim() === enteredPassword.trim()) {
                    this.unlockWithPassword();
                    return true;
                }
            } else {
                // Fallback für den Mock-Modus
                if (enteredPassword === "Physik8") {
                    this.unlockWithPassword();
                    return true;
                }
            }
        } catch (e) {
            console.error("Fehler beim Prüfen des Passworts:", e);
        }
        return false;
    }
};
