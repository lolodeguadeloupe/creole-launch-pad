const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import des services
const EmailDatabase = require('./models/EmailDatabase');
const SMTPService = require('./services/SMTPService');
const POP3Service = require('./services/POP3Service');

// Import des routes
const emailRoutes = require('./routes/emailRoutes');
const authRoutes = require('./routes/authRoutes');

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

class EmailAPIServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.smtpPort = process.env.SMTP_PORT || 587;
        this.pop3Port = process.env.POP3_PORT || 110;
        
        this.initializeDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeEmailServices();
    }

    initializeDatabase() {
        console.log('📊 Initialisation de la base de données...');
        this.db = new EmailDatabase();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    }

    setupRoutes() {
        // Injecter les services dans les locals de l'app pour les middlewares et routes
        this.app.locals.db = this.db;
        
        // Routes publiques
        this.app.use('/api/auth', authRoutes);
        
        // Routes protégées
        this.app.use('/api/emails', authMiddleware, emailRoutes);
        
        // Route de santé
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                services: {
                    api: 'running',
                    smtp: this.smtpService ? 'running' : 'stopped',
                    pop3: this.pop3Service ? 'running' : 'stopped'
                }
            });
        });

        // Middleware de gestion d'erreurs
        this.app.use((err, req, res, next) => {
            console.error('Erreur:', err);
            res.status(500).json({ 
                error: 'Erreur interne du serveur',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur s\'est produite'
            });
        });
    }

    initializeEmailServices() {
        console.log('📧 Initialisation des services email...');
        
        // Service SMTP pour l'envoi
        this.smtpService = new SMTPService(this.db);
        this.smtpService.start(this.smtpPort);
        
        // Service POP3 pour la réception
        this.pop3Service = new POP3Service(this.db);
        this.pop3Service.start(this.pop3Port);
        
        // Injecter les services dans les locals de l'app
        this.app.locals.smtpService = this.smtpService;
        this.app.locals.pop3Service = this.pop3Service;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('🚀 Email API Server démarré!');
            console.log(`📡 API REST: http://localhost:${this.port}`);
            console.log(`📤 Serveur SMTP: localhost:${this.smtpPort}`);
            console.log(`📥 Serveur POP3: localhost:${this.pop3Port}`);
            console.log('');
            console.log('🔗 Endpoints disponibles:');
            console.log(`   GET  /health - État du serveur`);
            console.log(`   POST /api/auth/login - Connexion`);
            console.log(`   POST /api/emails/send - Envoyer un email`);
            console.log(`   GET  /api/emails/inbox - Boîte de réception`);
            console.log(`   GET  /api/emails/sent - Emails envoyés`);
        });
    }

    stop() {
        console.log('🛑 Arrêt du serveur...');
        if (this.smtpService) this.smtpService.stop();
        if (this.pop3Service) this.pop3Service.stop();
        if (this.db) this.db.close();
    }
}

// Gestion des signaux d'arrêt
const server = new EmailAPIServer();

process.on('SIGINT', () => {
    console.log('\n👋 Signal SIGINT reçu, arrêt propre...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Signal SIGTERM reçu, arrêt propre...');
    server.stop();
    process.exit(0);
});

// Démarrage du serveur
server.start();

module.exports = EmailAPIServer; 