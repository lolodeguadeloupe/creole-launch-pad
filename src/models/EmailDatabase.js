const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class EmailDatabase {
    constructor(dbPath = path.join(__dirname, '../../data/emails.db')) {
        this.dbPath = dbPath;
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Erreur lors de l\'ouverture de la base de données:', err);
            } else {
                console.log('✅ Base de données connectée:', dbPath);
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        // Table des utilisateurs
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1
            )
        `);

        // Table des emails
        this.db.run(`
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id TEXT UNIQUE NOT NULL,
                from_address TEXT NOT NULL,
                to_address TEXT NOT NULL,
                cc_addresses TEXT,
                bcc_addresses TEXT,
                subject TEXT,
                body_text TEXT,
                body_html TEXT,
                attachments TEXT,
                headers TEXT,
                status TEXT DEFAULT 'pending',
                direction TEXT NOT NULL,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                sent_at DATETIME,
                received_at DATETIME,
                read_at DATETIME,
                is_read BOOLEAN DEFAULT 0,
                is_starred BOOLEAN DEFAULT 0,
                is_deleted BOOLEAN DEFAULT 0,
                folder TEXT DEFAULT 'inbox',
                raw_message TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Table des attachments
        this.db.run(`
            CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                content_type TEXT,
                size INTEGER,
                content BLOB,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (email_id) REFERENCES emails (id)
            )
        `);

        // Table des sessions
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Créer un utilisateur par défaut si aucun n'existe
        this.createDefaultUser();
    }

    createDefaultUser() {
        const defaultEmail = 'admin@localhost';
        const defaultPassword = 'admin123';
        
        this.getUser(defaultEmail, (err, user) => {
            if (err || !user) {
                this.createUser(defaultEmail, defaultPassword, 'Administrateur', (err, userId) => {
                    if (!err) {
                        console.log('👤 Utilisateur par défaut créé:', defaultEmail);
                        console.log('🔑 Mot de passe par défaut:', defaultPassword);
                    }
                });
            }
        });
    }

    // MÉTHODES UTILISATEURS
    createUser(email, password, fullName, callback) {
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        this.db.run(
            'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
            [email, passwordHash, fullName],
            function(err) {
                callback(err, this.lastID);
            }
        );
    }

    getUser(email, callback) {
        this.db.get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email],
            callback
        );
    }

    getUserById(userId, callback) {
        this.db.get(
            'SELECT * FROM users WHERE id = ? AND is_active = 1',
            [userId],
            callback
        );
    }

    verifyUser(email, password, callback) {
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        this.db.get(
            'SELECT * FROM users WHERE email = ? AND password_hash = ? AND is_active = 1',
            [email, passwordHash],
            (err, user) => {
                if (err) return callback(err);
                
                if (user) {
                    // Mettre à jour la dernière connexion
                    this.db.run(
                        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                        [user.id]
                    );
                }
                
                callback(null, user);
            }
        );
    }

    // MÉTHODES SESSIONS
    createSession(userId, callback) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
        
        this.db.run(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt],
            function(err) {
                callback(err, { token, expiresAt });
            }
        );
    }

    verifySession(token, callback) {
        this.db.get(`
            SELECT s.*, u.email, u.full_name 
            FROM sessions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
        `, [token], callback);
    }

    deleteSession(token, callback) {
        this.db.run('DELETE FROM sessions WHERE token = ?', [token], callback);
    }

    // MÉTHODES EMAILS
    saveEmail(emailData, callback) {
        const {
            messageId, from, to, cc, bcc, subject, 
            bodyText, bodyHtml, attachments, headers,
            direction, userId, status = 'pending'
        } = emailData;

        this.db.run(`
            INSERT INTO emails (
                message_id, from_address, to_address, cc_addresses, bcc_addresses,
                subject, body_text, body_html, attachments, headers,
                direction, user_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            messageId, from, to, 
            cc ? JSON.stringify(cc) : null,
            bcc ? JSON.stringify(bcc) : null,
            subject, bodyText, bodyHtml,
            attachments ? JSON.stringify(attachments) : null,
            headers ? JSON.stringify(headers) : null,
            direction, userId, status
        ], function(err) {
            callback(err, this.lastID);
        });
    }

    getEmails(userId, folder = 'inbox', limit = 50, offset = 0, callback) {
        this.db.all(`
            SELECT * FROM emails 
            WHERE user_id = ? AND folder = ? AND is_deleted = 0
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [userId, folder, limit, offset], callback);
    }

    getEmailById(emailId, userId, callback) {
        this.db.get(`
            SELECT * FROM emails 
            WHERE id = ? AND user_id = ?
        `, [emailId, userId], callback);
    }

    markEmailAsRead(emailId, userId, callback) {
        this.db.run(`
            UPDATE emails 
            SET is_read = 1, read_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?
        `, [emailId, userId], callback);
    }

    updateEmailStatus(emailId, status, callback) {
        this.db.run(
            'UPDATE emails SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, emailId],
            callback
        );
    }

    deleteEmail(emailId, userId, callback) {
        this.db.run(`
            UPDATE emails 
            SET is_deleted = 1 
            WHERE id = ? AND user_id = ?
        `, [emailId, userId], callback);
    }

    // MÉTHODES ATTACHMENTS
    saveAttachment(emailId, filename, contentType, size, content, callback) {
        this.db.run(`
            INSERT INTO attachments (email_id, filename, content_type, size, content)
            VALUES (?, ?, ?, ?, ?)
        `, [emailId, filename, contentType, size, content], function(err) {
            callback(err, this.lastID);
        });
    }

    getAttachments(emailId, callback) {
        this.db.all(
            'SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?',
            [emailId],
            callback
        );
    }

    getAttachmentContent(attachmentId, callback) {
        this.db.get(
            'SELECT * FROM attachments WHERE id = ?',
            [attachmentId],
            callback
        );
    }

    // MÉTHODES UTILITAIRES
    getEmailStats(userId, callback) {
        this.db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as received,
                SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as sent
            FROM emails 
            WHERE user_id = ? AND is_deleted = 0
        `, [userId], callback);
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Erreur lors de la fermeture de la base de données:', err);
                } else {
                    console.log('✅ Base de données fermée');
                }
            });
        }
    }
}

module.exports = EmailDatabase; 