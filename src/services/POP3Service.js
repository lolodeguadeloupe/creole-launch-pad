const net = require('net');
const crypto = require('crypto');

class POP3Service {
    constructor(database) {
        this.db = database;
        this.server = null;
        this.port = null;
        this.sessions = new Map();
    }

    start(port = 110) {
        this.port = port;

        this.server = net.createServer((socket) => {
            this.handleConnection(socket);
        });

        this.server.listen(port, (err) => {
            if (err) {
                console.error('❌ Erreur démarrage serveur POP3:', err);
            } else {
                console.log(`✅ Serveur POP3 démarré sur le port ${port}`);
            }
        });

        this.server.on('error', (err) => {
            console.error('❌ Erreur serveur POP3:', err);
        });
    }

    handleConnection(socket) {
        const sessionId = crypto.randomUUID();
        const session = {
            id: sessionId,
            socket: socket,
            state: 'AUTHORIZATION', // AUTHORIZATION, TRANSACTION, UPDATE
            user: null,
            authenticated: false,
            emails: [],
            deletedEmails: new Set(),
            buffer: ''
        };

        this.sessions.set(sessionId, session);

        console.log(`📥 Nouvelle connexion POP3: ${socket.remoteAddress}`);

        // Envoyer le message de bienvenue
        this.sendResponse(session, '+OK Email API POP3 Server ready');

        // Gérer les données reçues
        socket.on('data', (data) => {
            this.handleData(session, data);
        });

        // Gérer la fermeture de connexion
        socket.on('close', () => {
            console.log(`🔐 Connexion POP3 fermée: ${sessionId}`);
            this.sessions.delete(sessionId);
        });

        // Gérer les erreurs
        socket.on('error', (err) => {
            console.error('❌ Erreur socket POP3:', err);
            this.sessions.delete(sessionId);
        });
    }

    handleData(session, data) {
        session.buffer += data.toString();

        // Traiter les commandes complètes (terminées par CRLF)
        let lines = session.buffer.split('\r\n');
        session.buffer = lines.pop(); // Garder la ligne incomplète

        for (let line of lines) {
            if (line.trim()) {
                this.processCommand(session, line.trim());
            }
        }
    }

    processCommand(session, command) {
        const parts = command.split(' ');
        const cmd = parts[0].toUpperCase();
        const args = parts.slice(1);

        console.log(`📝 Commande POP3: ${cmd} ${args.join(' ')}`);

        switch (session.state) {
            case 'AUTHORIZATION':
                this.handleAuthCommand(session, cmd, args);
                break;
            case 'TRANSACTION':
                this.handleTransactionCommand(session, cmd, args);
                break;
            default:
                this.sendResponse(session, '-ERR Command not recognized');
        }
    }

    handleAuthCommand(session, cmd, args) {
        switch (cmd) {
            case 'USER':
                if (args.length === 0) {
                    this.sendResponse(session, '-ERR Username required');
                    return;
                }
                session.username = args[0];
                this.sendResponse(session, '+OK Username accepted');
                break;

            case 'PASS':
                if (!session.username) {
                    this.sendResponse(session, '-ERR Username required first');
                    return;
                }
                if (args.length === 0) {
                    this.sendResponse(session, '-ERR Password required');
                    return;
                }

                const password = args[0];
                this.authenticateUser(session, session.username, password);
                break;

            case 'QUIT':
                this.sendResponse(session, '+OK Goodbye');
                session.socket.end();
                break;

            default:
                this.sendResponse(session, '-ERR Command not recognized in AUTHORIZATION state');
        }
    }

    handleTransactionCommand(session, cmd, args) {
        switch (cmd) {
            case 'STAT':
                this.handleStat(session);
                break;

            case 'LIST':
                this.handleList(session, args);
                break;

            case 'RETR':
                this.handleRetr(session, args);
                break;

            case 'DELE':
                this.handleDele(session, args);
                break;

            case 'NOOP':
                this.sendResponse(session, '+OK');
                break;

            case 'RSET':
                this.handleRset(session);
                break;

            case 'TOP':
                this.handleTop(session, args);
                break;

            case 'UIDL':
                this.handleUidl(session, args);
                break;

            case 'QUIT':
                this.handleQuit(session);
                break;

            default:
                this.sendResponse(session, '-ERR Command not recognized');
        }
    }

    authenticateUser(session, username, password) {
        this.db.verifyUser(username, password, (err, user) => {
            if (err || !user) {
                this.sendResponse(session, '-ERR Authentication failed');
                return;
            }

            session.user = user;
            session.authenticated = true;
            session.state = 'TRANSACTION';

            // Charger les emails de l'utilisateur
            this.loadUserEmails(session, (err) => {
                if (err) {
                    this.sendResponse(session, '-ERR Failed to load emails');
                    return;
                }

                this.sendResponse(session, `+OK Mailbox open, ${session.emails.length} messages`);
                console.log(`👤 Utilisateur POP3 authentifié: ${user.email}`);
            });
        });
    }

    loadUserEmails(session, callback) {
        this.db.getEmails(session.user.id, 'inbox', 100, 0, (err, emails) => {
            if (err) {
                return callback(err);
            }

            // Filtrer les emails non supprimés
            session.emails = emails.filter(email => !email.is_deleted);
            callback();
        });
    }

    handleStat(session) {
        const activeEmails = session.emails.filter((email, index) => 
            !session.deletedEmails.has(index + 1)
        );
        
        const totalSize = activeEmails.reduce((sum, email) => {
            const bodyLength = (email.body_text || email.body_html || '').length;
            return sum + bodyLength;
        }, 0);

        this.sendResponse(session, `+OK ${activeEmails.length} ${totalSize}`);
    }

    handleList(session, args) {
        if (args.length > 0) {
            // Liste d'un message spécifique
            const msgNum = parseInt(args[0]);
            if (msgNum < 1 || msgNum > session.emails.length || session.deletedEmails.has(msgNum)) {
                this.sendResponse(session, '-ERR No such message');
                return;
            }

            const email = session.emails[msgNum - 1];
            const size = (email.body_text || email.body_html || '').length;
            this.sendResponse(session, `+OK ${msgNum} ${size}`);
        } else {
            // Liste de tous les messages
            this.sendResponse(session, `+OK ${session.emails.length} messages`);
            
            session.emails.forEach((email, index) => {
                const msgNum = index + 1;
                if (!session.deletedEmails.has(msgNum)) {
                    const size = (email.body_text || email.body_html || '').length;
                    this.sendResponse(session, `${msgNum} ${size}`);
                }
            });
            
            this.sendResponse(session, '.');
        }
    }

    handleRetr(session, args) {
        if (args.length === 0) {
            this.sendResponse(session, '-ERR Message number required');
            return;
        }

        const msgNum = parseInt(args[0]);
        if (msgNum < 1 || msgNum > session.emails.length || session.deletedEmails.has(msgNum)) {
            this.sendResponse(session, '-ERR No such message');
            return;
        }

        const email = session.emails[msgNum - 1];
        const fullMessage = this.formatEmailMessage(email);
        
        this.sendResponse(session, `+OK ${fullMessage.length} octets`);
        this.sendResponse(session, fullMessage);
        this.sendResponse(session, '.');

        // Marquer comme lu
        this.db.markEmailAsRead(email.id, session.user.id, () => {});
    }

    handleDele(session, args) {
        if (args.length === 0) {
            this.sendResponse(session, '-ERR Message number required');
            return;
        }

        const msgNum = parseInt(args[0]);
        if (msgNum < 1 || msgNum > session.emails.length || session.deletedEmails.has(msgNum)) {
            this.sendResponse(session, '-ERR No such message');
            return;
        }

        session.deletedEmails.add(msgNum);
        this.sendResponse(session, `+OK Message ${msgNum} deleted`);
    }

    handleRset(session) {
        session.deletedEmails.clear();
        this.sendResponse(session, '+OK');
    }

    handleTop(session, args) {
        if (args.length < 2) {
            this.sendResponse(session, '-ERR Message number and line count required');
            return;
        }

        const msgNum = parseInt(args[0]);
        const lineCount = parseInt(args[1]);

        if (msgNum < 1 || msgNum > session.emails.length || session.deletedEmails.has(msgNum)) {
            this.sendResponse(session, '-ERR No such message');
            return;
        }

        const email = session.emails[msgNum - 1];
        const fullMessage = this.formatEmailMessage(email);
        const lines = fullMessage.split('\r\n');
        
        // Trouver la fin des headers
        let headerEnd = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === '') {
                headerEnd = i;
                break;
            }
        }

        // Retourner les headers + le nombre de lignes demandé du body
        const topLines = lines.slice(0, headerEnd + 1 + lineCount);
        
        this.sendResponse(session, '+OK');
        this.sendResponse(session, topLines.join('\r\n'));
        this.sendResponse(session, '.');
    }

    handleUidl(session, args) {
        if (args.length > 0) {
            // UIDL d'un message spécifique
            const msgNum = parseInt(args[0]);
            if (msgNum < 1 || msgNum > session.emails.length || session.deletedEmails.has(msgNum)) {
                this.sendResponse(session, '-ERR No such message');
                return;
            }

            const email = session.emails[msgNum - 1];
            this.sendResponse(session, `+OK ${msgNum} ${email.message_id}`);
        } else {
            // UIDL de tous les messages
            this.sendResponse(session, '+OK');
            
            session.emails.forEach((email, index) => {
                const msgNum = index + 1;
                if (!session.deletedEmails.has(msgNum)) {
                    this.sendResponse(session, `${msgNum} ${email.message_id}`);
                }
            });
            
            this.sendResponse(session, '.');
        }
    }

    handleQuit(session) {
        // Appliquer les suppressions
        const deletePromises = [];
        
        session.deletedEmails.forEach(msgNum => {
            const email = session.emails[msgNum - 1];
            if (email) {
                deletePromises.push(
                    new Promise((resolve) => {
                        this.db.deleteEmail(email.id, session.user.id, resolve);
                    })
                );
            }
        });

        Promise.all(deletePromises).then(() => {
            this.sendResponse(session, '+OK Goodbye');
            session.socket.end();
        });
    }

    formatEmailMessage(email) {
        // Construire le message email complet
        let message = '';

        // Headers
        message += `Message-ID: ${email.message_id}\r\n`;
        message += `From: ${email.from_address}\r\n`;
        message += `To: ${email.to_address}\r\n`;
        
        if (email.cc_addresses) {
            message += `Cc: ${email.cc_addresses}\r\n`;
        }
        
        message += `Subject: ${email.subject || '(No subject)'}\r\n`;
        message += `Date: ${new Date(email.created_at).toUTCString()}\r\n`;
        
        if (email.body_html) {
            message += `Content-Type: text/html; charset=utf-8\r\n`;
        } else {
            message += `Content-Type: text/plain; charset=utf-8\r\n`;
        }

        // Headers additionnels si présents
        if (email.headers) {
            try {
                const additionalHeaders = JSON.parse(email.headers);
                for (const [key, value] of Object.entries(additionalHeaders)) {
                    if (!['message-id', 'from', 'to', 'cc', 'subject', 'date', 'content-type'].includes(key.toLowerCase())) {
                        message += `${key}: ${value}\r\n`;
                    }
                }
            } catch (e) {
                // Ignorer les erreurs de parsing des headers
            }
        }

        // Ligne vide séparant headers et body
        message += '\r\n';

        // Body
        if (email.body_html) {
            message += email.body_html;
        } else if (email.body_text) {
            message += email.body_text;
        }

        return message;
    }

    sendResponse(session, response) {
        if (session.socket && !session.socket.destroyed) {
            session.socket.write(response + '\r\n');
        }
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🛑 Serveur POP3 arrêté');
            });

            // Fermer toutes les sessions actives
            this.sessions.forEach(session => {
                if (session.socket && !session.socket.destroyed) {
                    session.socket.end();
                }
            });
            this.sessions.clear();
        }
    }
}

module.exports = POP3Service; 