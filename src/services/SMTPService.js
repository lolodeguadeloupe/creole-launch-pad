const { SMTPServer } = require('smtp-server');
const crypto = require('crypto');
const net = require('net');
const tls = require('tls');

class SMTPService {
    constructor(database) {
        this.db = database;
        this.server = null;
        this.port = null;
    }

    start(port = 587) {
        this.port = port;

        this.server = new SMTPServer({
            // Configuration de base
            banner: 'Email API SMTP Server',
            size: 50 * 1024 * 1024, // 50MB max
            allowInsecureAuth: true,
            hideSize: false,
            hidePipelining: false,
            hide8BITMIME: false,

            // Authentification
            onAuth: this.handleAuth.bind(this),
            
            // Validation des adresses
            onMailFrom: this.handleMailFrom.bind(this),
            onRcptTo: this.handleRcptTo.bind(this),
            
            // Réception du message
            onData: this.handleData.bind(this),
            
            // Gestion des erreurs
            onError: this.handleError.bind(this),
            onClose: this.handleClose.bind(this)
        });

        this.server.listen(port, (err) => {
            if (err) {
                console.error('❌ Erreur démarrage serveur SMTP:', err);
            } else {
                console.log(`✅ Serveur SMTP démarré sur le port ${port}`);
            }
        });
    }

    handleAuth(auth, session, callback) {
        // Authentification des utilisateurs
        const { username, password } = auth;
        
        if (!username || !password) {
            return callback(new Error('Nom d\'utilisateur et mot de passe requis'));
        }

        this.db.verifyUser(username, password, (err, user) => {
            if (err) {
                console.error('Erreur authentification SMTP:', err);
                return callback(new Error('Erreur d\'authentification'));
            }

            if (!user) {
                return callback(new Error('Identifiants invalides'));
            }

            // Stocker les informations utilisateur dans la session
            session.user = user;
            console.log(`📧 Utilisateur authentifié SMTP: ${user.email}`);
            callback();
        });
    }

    handleMailFrom(address, session, callback) {
        // Valider l'expéditeur
        if (!session.user) {
            return callback(new Error('Authentification requise'));
        }

        // Vérifier que l'utilisateur peut envoyer depuis cette adresse
        if (address.address !== session.user.email) {
            return callback(new Error('Non autorisé à envoyer depuis cette adresse'));
        }

        session.envelope.mailFrom = address;
        console.log(`📤 Mail from: ${address.address}`);
        callback();
    }

    handleRcptTo(address, session, callback) {
        // Valider le destinataire
        if (!session.envelope.rcptTo) {
            session.envelope.rcptTo = [];
        }

        session.envelope.rcptTo.push(address);
        console.log(`📬 Mail to: ${address.address}`);
        callback();
    }

    async handleData(stream, session, callback) {
        try {
            // Collecter le contenu de l'email
            let rawMessage = '';
            
            stream.on('data', (chunk) => {
                rawMessage += chunk.toString();
            });

            stream.on('end', async () => {
                try {
                    // Parser le message email
                    const emailData = await this.parseEmailMessage(rawMessage, session);
                    
                    // Sauvegarder l'email dans la base de données
                    this.db.saveEmail(emailData, (err, emailId) => {
                        if (err) {
                            console.error('Erreur sauvegarde email:', err);
                            return callback(new Error('Erreur lors de la sauvegarde'));
                        }

                        // Marquer comme envoyé
                        this.db.updateEmailStatus(emailId, 'sent', (err) => {
                            if (err) {
                                console.error('Erreur mise à jour statut:', err);
                            }
                        });

                        console.log(`✅ Email envoyé et sauvegardé (ID: ${emailId})`);
                        
                        // Simuler l'envoi vers les destinataires externes
                        this.deliverEmail(emailData, session);
                        
                        callback();
                    });
                } catch (error) {
                    console.error('Erreur traitement email:', error);
                    callback(new Error('Erreur lors du traitement de l\'email'));
                }
            });

            stream.on('error', (err) => {
                console.error('Erreur lecture stream:', err);
                callback(err);
            });

        } catch (error) {
            console.error('Erreur handleData:', error);
            callback(error);
        }
    }

    async parseEmailMessage(rawMessage, session) {
        // Parser basique du message email
        const lines = rawMessage.split('\r\n');
        let isHeader = true;
        let headers = {};
        let body = '';

        for (let line of lines) {
            if (isHeader) {
                if (line === '') {
                    isHeader = false;
                    continue;
                }

                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).toLowerCase();
                    const value = line.substring(colonIndex + 1).trim();
                    headers[key] = value;
                }
            } else {
                body += line + '\r\n';
            }
        }

        // Générer un ID unique pour le message
        const messageId = headers['message-id'] || 
            `<${crypto.randomUUID()}@${session.hostNameAppearsAs || 'localhost'}>`;

        // Extraire les destinataires
        const toAddresses = session.envelope.rcptTo.map(addr => addr.address).join(', ');
        
        // Extraire le sujet
        const subject = headers['subject'] || '(Aucun sujet)';

        // Détecter si c'est du HTML ou du texte
        const contentType = headers['content-type'] || '';
        const isHtml = contentType.includes('text/html');

        return {
            messageId,
            from: session.envelope.mailFrom.address,
            to: toAddresses,
            cc: headers['cc'] || null,
            bcc: headers['bcc'] || null,
            subject,
            bodyText: isHtml ? null : body.trim(),
            bodyHtml: isHtml ? body.trim() : null,
            headers,
            direction: 'outgoing',
            userId: session.user.id,
            status: 'sent',
            rawMessage
        };
    }

    async deliverEmail(emailData, session) {
        // Simuler la livraison des emails
        console.log(`🚀 Livraison simulée de l'email:`);
        console.log(`   De: ${emailData.from}`);
        console.log(`   À: ${emailData.to}`);
        console.log(`   Sujet: ${emailData.subject}`);

        // Ici, vous pourriez implémenter la logique de livraison réelle :
        // - Vérifier si le destinataire est local
        // - Si local, créer un email entrant dans la base
        // - Si externe, transmettre via SMTP externe
        
        // Pour l'instant, simulons la livraison locale
        const recipients = emailData.to.split(',').map(addr => addr.trim());
        
        for (let recipient of recipients) {
            // Vérifier si le destinataire existe localement
            this.db.getUser(recipient, (err, recipientUser) => {
                if (!err && recipientUser) {
                    // Créer l'email entrant pour le destinataire local
                    const incomingEmail = {
                        ...emailData,
                        direction: 'incoming',
                        userId: recipientUser.id,
                        status: 'delivered',
                        folder: 'inbox'
                    };

                    this.db.saveEmail(incomingEmail, (err, emailId) => {
                        if (!err) {
                            console.log(`📨 Email livré localement à ${recipient} (ID: ${emailId})`);
                        }
                    });
                } else {
                    console.log(`📡 Email externe vers ${recipient} (simulation)`);
                }
            });
        }
    }

    handleError(err) {
        console.error('❌ Erreur serveur SMTP:', err);
    }

    handleClose(session) {
        console.log('🔐 Session SMTP fermée');
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🛑 Serveur SMTP arrêté');
            });
        }
    }

    // Méthode pour envoyer un email via l'API (sans passer par SMTP)
    async sendEmailDirect(emailData, userId) {
        return new Promise((resolve, reject) => {
            // Générer un ID de message unique
            const messageId = `<${crypto.randomUUID()}@localhost>`;
            
            const email = {
                messageId,
                from: emailData.from,
                to: emailData.to,
                cc: emailData.cc,
                bcc: emailData.bcc,
                subject: emailData.subject,
                bodyText: emailData.bodyText,
                bodyHtml: emailData.bodyHtml,
                direction: 'outgoing',
                userId: userId,
                status: 'sent'
            };

            this.db.saveEmail(email, (err, emailId) => {
                if (err) {
                    return reject(err);
                }

                // Simuler la livraison
                this.simulateDelivery(email);
                
                resolve({ emailId, messageId });
            });
        });
    }

    simulateDelivery(emailData) {
        // Simuler la livraison pour les destinataires locaux
        const recipients = emailData.to.split(',').map(addr => addr.trim());
        
        recipients.forEach(recipient => {
            this.db.getUser(recipient, (err, recipientUser) => {
                if (!err && recipientUser) {
                    const incomingEmail = {
                        ...emailData,
                        direction: 'incoming',
                        userId: recipientUser.id,
                        status: 'delivered',
                        folder: 'inbox'
                    };

                    this.db.saveEmail(incomingEmail, (err, emailId) => {
                        if (!err) {
                            console.log(`📨 Email livré à ${recipient}`);
                        }
                    });
                }
            });
        });
    }
}

module.exports = SMTPService; 