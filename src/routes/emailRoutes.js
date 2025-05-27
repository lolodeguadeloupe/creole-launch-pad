const express = require('express');
const router = express.Router();

// Ces variables seront injectées par le serveur principal
let db = null;
let smtpService = null;

// Middleware pour injecter les services
router.use((req, res, next) => {
    if (!db && req.app.locals.db) {
        db = req.app.locals.db;
    }
    if (!smtpService && req.app.locals.smtpService) {
        smtpService = req.app.locals.smtpService;
    }
    next();
});

/**
 * POST /api/emails/send
 * Envoyer un nouvel email
 */
router.post('/send', async (req, res) => {
    try {
        const { to, cc, bcc, subject, bodyText, bodyHtml, attachments } = req.body;

        // Validation des données
        if (!to || (!bodyText && !bodyHtml)) {
            return res.status(400).json({
                error: 'Destinataire et contenu de l\'email requis'
            });
        }

        // Récupérer l'utilisateur depuis le middleware d'auth
        const user = req.user;

        // Préparer les données de l'email
        const emailData = {
            from: user.email,
            to: to.trim(),
            cc: cc ? cc.trim() : null,
            bcc: bcc ? bcc.trim() : null,
            subject: subject || '(Aucun sujet)',
            bodyText: bodyText || null,
            bodyHtml: bodyHtml || null,
            attachments: attachments || null
        };

        // Envoyer l'email via le service SMTP
        try {
            const result = await smtpService.sendEmailDirect(emailData, user.id);

            res.json({
                success: true,
                message: 'Email envoyé avec succès',
                emailId: result.emailId,
                messageId: result.messageId
            });

            console.log(`📤 Email envoyé par ${user.email} vers ${to}`);

        } catch (error) {
            console.error('Erreur envoi email:', error);
            res.status(500).json({
                error: 'Erreur lors de l\'envoi de l\'email'
            });
        }

    } catch (error) {
        console.error('Erreur route send:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * GET /api/emails/inbox
 * Récupérer la boîte de réception
 */
router.get('/inbox', (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        db.getEmails(user.id, 'inbox', limit, offset, (err, emails) => {
            if (err) {
                console.error('Erreur récupération inbox:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la récupération des emails'
                });
            }

            // Formater les emails pour la réponse
            const formattedEmails = emails.map(email => ({
                id: email.id,
                messageId: email.message_id,
                from: email.from_address,
                to: email.to_address,
                cc: email.cc_addresses ? JSON.parse(email.cc_addresses) : null,
                subject: email.subject,
                preview: email.body_text ? 
                    email.body_text.substring(0, 150) + '...' : 
                    email.body_html ? 
                        email.body_html.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
                        '(Aucun contenu)',
                isRead: !!email.is_read,
                isStarred: !!email.is_starred,
                hasAttachments: !!email.attachments,
                createdAt: email.created_at,
                receivedAt: email.received_at
            }));

            res.json({
                success: true,
                emails: formattedEmails,
                pagination: {
                    page,
                    limit,
                    hasMore: emails.length === limit
                }
            });
        });

    } catch (error) {
        console.error('Erreur route inbox:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * GET /api/emails/sent
 * Récupérer les emails envoyés
 */
router.get('/sent', (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Récupérer les emails envoyés
        db.db.all(`
            SELECT * FROM emails 
            WHERE user_id = ? AND direction = 'outgoing' AND is_deleted = 0
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [user.id, limit, offset], (err, emails) => {
            if (err) {
                console.error('Erreur récupération sent:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la récupération des emails envoyés'
                });
            }

            // Formater les emails pour la réponse
            const formattedEmails = emails.map(email => ({
                id: email.id,
                messageId: email.message_id,
                from: email.from_address,
                to: email.to_address,
                cc: email.cc_addresses ? JSON.parse(email.cc_addresses) : null,
                subject: email.subject,
                preview: email.body_text ? 
                    email.body_text.substring(0, 150) + '...' : 
                    email.body_html ? 
                        email.body_html.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
                        '(Aucun contenu)',
                status: email.status,
                hasAttachments: !!email.attachments,
                createdAt: email.created_at,
                sentAt: email.sent_at
            }));

            res.json({
                success: true,
                emails: formattedEmails,
                pagination: {
                    page,
                    limit,
                    hasMore: emails.length === limit
                }
            });
        });

    } catch (error) {
        console.error('Erreur route sent:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * GET /api/emails/:id
 * Récupérer un email spécifique
 */
router.get('/:id', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const user = req.user;

        if (!emailId || isNaN(emailId)) {
            return res.status(400).json({
                error: 'ID d\'email invalide'
            });
        }

        db.getEmailById(emailId, user.id, (err, email) => {
            if (err) {
                console.error('Erreur récupération email:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la récupération de l\'email'
                });
            }

            if (!email) {
                return res.status(404).json({
                    error: 'Email non trouvé'
                });
            }

            // Marquer comme lu si c'est un email entrant et pas encore lu
            if (email.direction === 'incoming' && !email.is_read) {
                db.markEmailAsRead(emailId, user.id, () => {});
            }

            // Récupérer les pièces jointes
            db.getAttachments(emailId, (err, attachments) => {
                if (err) {
                    console.error('Erreur récupération attachments:', err);
                    attachments = [];
                }

                // Formater l'email complet
                const formattedEmail = {
                    id: email.id,
                    messageId: email.message_id,
                    from: email.from_address,
                    to: email.to_address,
                    cc: email.cc_addresses ? JSON.parse(email.cc_addresses) : null,
                    bcc: email.bcc_addresses ? JSON.parse(email.bcc_addresses) : null,
                    subject: email.subject,
                    bodyText: email.body_text,
                    bodyHtml: email.body_html,
                    headers: email.headers ? JSON.parse(email.headers) : null,
                    direction: email.direction,
                    status: email.status,
                    isRead: !!email.is_read,
                    isStarred: !!email.is_starred,
                    folder: email.folder,
                    attachments: attachments,
                    createdAt: email.created_at,
                    sentAt: email.sent_at,
                    receivedAt: email.received_at,
                    readAt: email.read_at
                };

                res.json({
                    success: true,
                    email: formattedEmail
                });
            });
        });

    } catch (error) {
        console.error('Erreur route get email:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * PUT /api/emails/:id/read
 * Marquer un email comme lu/non lu
 */
router.put('/:id/read', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const user = req.user;
        const { isRead } = req.body;

        if (!emailId || isNaN(emailId)) {
            return res.status(400).json({
                error: 'ID d\'email invalide'
            });
        }

        // Vérifier que l'email appartient à l'utilisateur
        db.getEmailById(emailId, user.id, (err, email) => {
            if (err || !email) {
                return res.status(404).json({
                    error: 'Email non trouvé'
                });
            }

            // Mettre à jour le statut de lecture
            const readValue = isRead ? 1 : 0;
            const readAtValue = isRead ? 'CURRENT_TIMESTAMP' : 'NULL';

            db.db.run(`
                UPDATE emails 
                SET is_read = ?, read_at = ${isRead ? 'CURRENT_TIMESTAMP' : 'NULL'}
                WHERE id = ? AND user_id = ?
            `, [readValue, emailId, user.id], function(err) {
                if (err) {
                    console.error('Erreur mise à jour lecture:', err);
                    return res.status(500).json({
                        error: 'Erreur lors de la mise à jour'
                    });
                }

                res.json({
                    success: true,
                    message: `Email marqué comme ${isRead ? 'lu' : 'non lu'}`
                });
            });
        });

    } catch (error) {
        console.error('Erreur route mark read:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * PUT /api/emails/:id/star
 * Marquer un email comme favori/non favori
 */
router.put('/:id/star', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const user = req.user;
        const { isStarred } = req.body;

        if (!emailId || isNaN(emailId)) {
            return res.status(400).json({
                error: 'ID d\'email invalide'
            });
        }

        // Vérifier que l'email appartient à l'utilisateur
        db.getEmailById(emailId, user.id, (err, email) => {
            if (err || !email) {
                return res.status(404).json({
                    error: 'Email non trouvé'
                });
            }

            // Mettre à jour le statut favori
            db.db.run(`
                UPDATE emails 
                SET is_starred = ?
                WHERE id = ? AND user_id = ?
            `, [isStarred ? 1 : 0, emailId, user.id], function(err) {
                if (err) {
                    console.error('Erreur mise à jour favori:', err);
                    return res.status(500).json({
                        error: 'Erreur lors de la mise à jour'
                    });
                }

                res.json({
                    success: true,
                    message: `Email ${isStarred ? 'ajouté aux favoris' : 'retiré des favoris'}`
                });
            });
        });

    } catch (error) {
        console.error('Erreur route star:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * DELETE /api/emails/:id
 * Supprimer un email
 */
router.delete('/:id', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const user = req.user;

        if (!emailId || isNaN(emailId)) {
            return res.status(400).json({
                error: 'ID d\'email invalide'
            });
        }

        db.deleteEmail(emailId, user.id, (err) => {
            if (err) {
                console.error('Erreur suppression email:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la suppression'
                });
            }

            res.json({
                success: true,
                message: 'Email supprimé avec succès'
            });

            console.log(`🗑️ Email ${emailId} supprimé par ${user.email}`);
        });

    } catch (error) {
        console.error('Erreur route delete:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * GET /api/emails/search
 * Rechercher dans les emails
 */
router.get('/search', (req, res) => {
    try {
        const user = req.user;
        const { q, folder = 'inbox' } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                error: 'Terme de recherche trop court (minimum 2 caractères)'
            });
        }

        const searchTerm = `%${q.trim()}%`;

        db.db.all(`
            SELECT * FROM emails 
            WHERE user_id = ? AND folder = ? AND is_deleted = 0
            AND (
                subject LIKE ? OR 
                body_text LIKE ? OR 
                body_html LIKE ? OR
                from_address LIKE ? OR
                to_address LIKE ?
            )
            ORDER BY created_at DESC 
            LIMIT 50
        `, [
            user.id, folder, 
            searchTerm, searchTerm, searchTerm, searchTerm, searchTerm
        ], (err, emails) => {
            if (err) {
                console.error('Erreur recherche emails:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la recherche'
                });
            }

            // Formater les résultats
            const formattedEmails = emails.map(email => ({
                id: email.id,
                messageId: email.message_id,
                from: email.from_address,
                to: email.to_address,
                subject: email.subject,
                preview: email.body_text ? 
                    email.body_text.substring(0, 150) + '...' : 
                    email.body_html ? 
                        email.body_html.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
                        '(Aucun contenu)',
                isRead: !!email.is_read,
                isStarred: !!email.is_starred,
                hasAttachments: !!email.attachments,
                createdAt: email.created_at
            }));

            res.json({
                success: true,
                query: q,
                results: formattedEmails,
                count: formattedEmails.length
            });
        });

    } catch (error) {
        console.error('Erreur route search:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * GET /api/emails/stats
 * Récupérer les statistiques des emails
 */
router.get('/stats', (req, res) => {
    try {
        const user = req.user;

        db.getEmailStats(user.id, (err, stats) => {
            if (err) {
                console.error('Erreur récupération stats:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la récupération des statistiques'
                });
            }

            res.json({
                success: true,
                stats: {
                    total: stats.total || 0,
                    unread: stats.unread || 0,
                    received: stats.received || 0,
                    sent: stats.sent || 0
                }
            });
        });

    } catch (error) {
        console.error('Erreur route stats:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

module.exports = router; 