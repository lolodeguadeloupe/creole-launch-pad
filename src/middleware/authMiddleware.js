// Middleware d'authentification pour vérifier les tokens JWT
let db = null;

const authMiddleware = (req, res, next) => {
    try {
        // Récupérer la base de données depuis les locals de l'app
        if (!db && req.app.locals.db) {
            db = req.app.locals.db;
        }

        if (!db) {
            console.error('❌ Base de données non disponible dans le middleware auth');
            return res.status(500).json({
                error: 'Configuration du serveur incorrecte'
            });
        }

        // Récupérer le token depuis l'en-tête Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Token d\'authentification requis',
                code: 'NO_TOKEN'
            });
        }

        // Vérifier le format du token (Bearer <token>)
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        
        if (!tokenMatch) {
            return res.status(401).json({
                error: 'Format de token invalide. Utilisez: Bearer <token>',
                code: 'INVALID_FORMAT'
            });
        }

        const token = tokenMatch[1];

        // Vérifier le token dans la base de données
        db.verifySession(token, (err, session) => {
            if (err) {
                console.error('Erreur vérification session:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la vérification du token',
                    code: 'VERIFICATION_ERROR'
                });
            }

            if (!session) {
                return res.status(401).json({
                    error: 'Token invalide ou expiré',
                    code: 'INVALID_TOKEN'
                });
            }

            // Vérifier que la session n'est pas expirée
            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            
            if (now > expiresAt) {
                // Supprimer la session expirée
                db.deleteSession(token, () => {});
                
                return res.status(401).json({
                    error: 'Session expirée',
                    code: 'SESSION_EXPIRED'
                });
            }

            // Ajouter les informations utilisateur à la requête
            req.user = {
                id: session.user_id,
                email: session.email,
                fullName: session.full_name
            };

            req.session = {
                token: token,
                expiresAt: session.expires_at
            };

            // Optionnel : Renouveler la session si elle expire bientôt
            const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
            
            if (hoursUntilExpiry < 2) { // Renouveler si moins de 2h restantes
                const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                
                db.db.run(
                    'UPDATE sessions SET expires_at = ? WHERE token = ?',
                    [newExpiresAt, token],
                    (err) => {
                        if (!err) {
                            req.session.expiresAt = newExpiresAt;
                            console.log(`🔄 Session renouvelée pour ${session.email}`);
                        }
                    }
                );
            }

            next();
        });

    } catch (error) {
        console.error('Erreur middleware auth:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware optionnel pour les routes qui ne nécessitent pas forcément d'authentification
const optionalAuthMiddleware = (req, res, next) => {
    try {
        // Récupérer la base de données depuis les locals de l'app
        if (!db && req.app.locals.db) {
            db = req.app.locals.db;
        }

        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            // Pas d'authentification fournie, continuer sans utilisateur
            req.user = null;
            req.session = null;
            return next();
        }

        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        
        if (!tokenMatch) {
            // Format invalide, continuer sans utilisateur
            req.user = null;
            req.session = null;
            return next();
        }

        const token = tokenMatch[1];

        // Vérifier le token dans la base de données
        db.verifySession(token, (err, session) => {
            if (err || !session) {
                // Token invalide, continuer sans utilisateur
                req.user = null;
                req.session = null;
                return next();
            }

            // Vérifier que la session n'est pas expirée
            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            
            if (now > expiresAt) {
                // Session expirée, continuer sans utilisateur
                db.deleteSession(token, () => {});
                req.user = null;
                req.session = null;
                return next();
            }

            // Ajouter les informations utilisateur à la requête
            req.user = {
                id: session.user_id,
                email: session.email,
                fullName: session.full_name
            };

            req.session = {
                token: token,
                expiresAt: session.expires_at
            };

            next();
        });

    } catch (error) {
        console.error('Erreur middleware auth optionnel:', error);
        // En cas d'erreur, continuer sans utilisateur
        req.user = null;
        req.session = null;
        next();
    }
};

// Middleware pour vérifier les permissions d'admin
const adminMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentification requise',
                code: 'NO_AUTH'
            });
        }

        // Vérifier si l'utilisateur est admin (ici on considère que admin@localhost est admin)
        if (req.user.email !== 'admin@localhost') {
            return res.status(403).json({
                error: 'Permissions administrateur requises',
                code: 'ADMIN_REQUIRED'
            });
        }

        next();

    } catch (error) {
        console.error('Erreur middleware admin:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Fonction utilitaire pour extraire le token d'une requête
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return null;
    }

    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
    return tokenMatch ? tokenMatch[1] : null;
};

// Fonction utilitaire pour vérifier si un utilisateur est authentifié
const isAuthenticated = (req) => {
    return req.user !== null && req.user !== undefined;
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware,
    extractToken,
    isAuthenticated
}; 