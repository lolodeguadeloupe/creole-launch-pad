const express = require('express');
const router = express.Router();

// Cette variable sera injectée par le serveur principal
let db = null;

// Middleware pour injecter la base de données
router.use((req, res, next) => {
    if (!db && req.app.locals.db) {
        db = req.app.locals.db;
    }
    next();
});

/**
 * POST /api/auth/login
 * Authentification d'un utilisateur
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des données
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email et mot de passe requis'
            });
        }

        // Vérification des identifiants
        db.verifyUser(email, password, (err, user) => {
            if (err) {
                console.error('Erreur authentification:', err);
                return res.status(500).json({
                    error: 'Erreur lors de l\'authentification'
                });
            }

            if (!user) {
                return res.status(401).json({
                    error: 'Identifiants invalides'
                });
            }

            // Créer une session
            db.createSession(user.id, (err, session) => {
                if (err) {
                    console.error('Erreur création session:', err);
                    return res.status(500).json({
                        error: 'Erreur lors de la création de la session'
                    });
                }

                // Retourner les informations de l'utilisateur et le token
                res.json({
                    success: true,
                    message: 'Connexion réussie',
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.full_name,
                        lastLogin: user.last_login
                    },
                    token: session.token,
                    expiresAt: session.expiresAt
                });

                console.log(`👤 Connexion réussie: ${user.email}`);
            });
        });

    } catch (error) {
        console.error('Erreur route login:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * POST /api/auth/logout
 * Déconnexion d'un utilisateur
 */
router.post('/logout', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(400).json({
                error: 'Token requis'
            });
        }

        // Supprimer la session
        db.deleteSession(token, (err) => {
            if (err) {
                console.error('Erreur suppression session:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la déconnexion'
                });
            }

            res.json({
                success: true,
                message: 'Déconnexion réussie'
            });

            console.log('👋 Déconnexion réussie');
        });

    } catch (error) {
        console.error('Erreur route logout:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        // Validation des données
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email et mot de passe requis'
            });
        }

        // Validation du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Format d\'email invalide'
            });
        }

        // Validation du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Vérifier si l'utilisateur existe déjà
        db.getUser(email, (err, existingUser) => {
            if (err) {
                console.error('Erreur vérification utilisateur:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la vérification'
                });
            }

            if (existingUser) {
                return res.status(409).json({
                    error: 'Un utilisateur avec cet email existe déjà'
                });
            }

            // Créer le nouvel utilisateur
            db.createUser(email, password, fullName || email, (err, userId) => {
                if (err) {
                    console.error('Erreur création utilisateur:', err);
                    return res.status(500).json({
                        error: 'Erreur lors de la création du compte'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Compte créé avec succès',
                    user: {
                        id: userId,
                        email: email,
                        fullName: fullName || email
                    }
                });

                console.log(`👤 Nouvel utilisateur créé: ${email}`);
            });
        });

    } catch (error) {
        console.error('Erreur route register:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * GET /api/auth/profile
 * Récupérer le profil de l'utilisateur connecté
 */
router.get('/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Token requis'
            });
        }

        // Vérifier la session
        db.verifySession(token, (err, session) => {
            if (err) {
                console.error('Erreur vérification session:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la vérification de la session'
                });
            }

            if (!session) {
                return res.status(401).json({
                    error: 'Session invalide ou expirée'
                });
            }

            // Récupérer les statistiques de l'utilisateur
            db.getEmailStats(session.user_id, (err, stats) => {
                if (err) {
                    console.error('Erreur récupération stats:', err);
                    stats = { total: 0, unread: 0, received: 0, sent: 0 };
                }

                res.json({
                    success: true,
                    user: {
                        id: session.user_id,
                        email: session.email,
                        fullName: session.full_name
                    },
                    stats: stats
                });
            });
        });

    } catch (error) {
        console.error('Erreur route profile:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * POST /api/auth/change-password
 * Changer le mot de passe de l'utilisateur connecté
 */
router.post('/change-password', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { currentPassword, newPassword } = req.body;

        if (!token) {
            return res.status(401).json({
                error: 'Token requis'
            });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Mot de passe actuel et nouveau mot de passe requis'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Vérifier la session
        db.verifySession(token, (err, session) => {
            if (err || !session) {
                return res.status(401).json({
                    error: 'Session invalide ou expirée'
                });
            }

            // Vérifier le mot de passe actuel
            db.verifyUser(session.email, currentPassword, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Mot de passe actuel incorrect'
                    });
                }

                // Mettre à jour le mot de passe
                const crypto = require('crypto');
                const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

                db.db.run(
                    'UPDATE users SET password_hash = ? WHERE id = ?',
                    [newPasswordHash, user.id],
                    function(err) {
                        if (err) {
                            console.error('Erreur mise à jour mot de passe:', err);
                            return res.status(500).json({
                                error: 'Erreur lors de la mise à jour du mot de passe'
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Mot de passe modifié avec succès'
                        });

                        console.log(`🔑 Mot de passe modifié pour: ${session.email}`);
                    }
                );
            });
        });

    } catch (error) {
        console.error('Erreur route change-password:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
});

module.exports = router; 