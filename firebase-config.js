// firebase-config.js
// Trage hier deine echten Firebase-Zugangsdaten ein:
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db = null;
let useMock = true;

// Firebase initialisieren, falls eingebunden und Zugangsdaten gesetzt sind
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        useMock = false;
        console.log("Firebase Firestore erfolgreich initialisiert.");
    } catch (e) {
        console.warn("Fehler bei der Firebase-Initialisierung. Fallback auf Mock-Datenbank:", e);
    }
}

if (useMock) {
    console.log("Firebase läuft im MOCK-Modus (LocalStorage wird verwendet).");
    
    db = {
        collection(colName) {
            return {
                doc(docId) {
                    return {
                        async get() {
                            const key = `mock_fs_${colName}_${docId}`;
                            const val = localStorage.getItem(key);
                            return {
                                exists: val !== null,
                                data() { return val ? JSON.parse(val) : null; }
                            };
                        },
                        async set(data, options) {
                            const key = `mock_fs_${colName}_${docId}`;
                            let finalData = data;
                            if (options && options.merge) {
                                const old = localStorage.getItem(key);
                                if (old) {
                                    finalData = Object.assign(JSON.parse(old), data);
                                }
                            }
                            localStorage.setItem(key, JSON.stringify(finalData));
                            // Sende Storage-Event, damit andere Tabs (z. B. lehrer.html) live aktualisiert werden
                            window.dispatchEvent(new Event('storage'));
                        },
                        onSnapshot(callback) {
                            const key = `mock_fs_${colName}_${docId}`;
                            const handler = () => {
                                const val = localStorage.getItem(key);
                                callback({
                                    exists: val !== null,
                                    data() { return val ? JSON.parse(val) : null; }
                                });
                            };
                            window.addEventListener('storage', handler);
                            handler();
                            return () => window.removeEventListener('storage', handler);
                        }
                    };
                },
                onSnapshot(callback) {
                    const handler = () => {
                        const docs = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key.startsWith(`mock_fs_${colName}_`)) {
                                const docId = key.substring(`mock_fs_${colName}_`.length);
                                const val = localStorage.getItem(key);
                                docs.push({
                                    id: docId,
                                    data() { return JSON.parse(val); }
                                });
                            }
                        }
                        callback({
                            forEach(cb) {
                                docs.forEach(cb);
                            }
                        });
                    };
                    window.addEventListener('storage', handler);
                    handler();
                    return () => window.removeEventListener('storage', handler);
                }
            };
        }
    };
}
