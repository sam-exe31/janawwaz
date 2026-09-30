"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("./config");
const errorHandler_1 = require("./common/errorHandler");
const swagger_1 = require("./docs/swagger");
const authRoutes_1 = __importDefault(require("./auth/authRoutes"));
const publicRoutes_1 = __importDefault(require("./public/publicRoutes"));
const userRoutes_1 = __importDefault(require("./user/userRoutes"));
const uploadRoutes_1 = __importDefault(require("./storage/uploadRoutes"));
const requestRoutes_1 = __importDefault(require("./request/requestRoutes"));
const notificationRoutes_1 = __importDefault(require("./notification/notificationRoutes"));
const ngoRoutes_1 = __importDefault(require("./ngo/ngoRoutes"));
const adminRoutes_1 = __importDefault(require("./admin/adminRoutes"));
const volunteerRoutes_1 = __importDefault(require("./volunteer/volunteerRoutes"));
const aiRoutes_1 = __importDefault(require("./ai/aiRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboard/dashboardRoutes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
// Security and utility middlewares
app.use((0, helmet_1.default)({ contentSecurityPolicy: false })); // Allow Swagger UI inline scripts & demo SPA
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, cookie_parser_1.default)(config_1.config.server.cookieSecret));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve frontend static assets from public/ directory
const publicDir = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicDir));
// Health Check
app.get(['/actuator/health', '/health'], (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});
// Swagger UI docs
app.use(['/swagger-ui.html', '/api/docs'], swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocument));
// Mount API v1 Routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/public', publicRoutes_1.default);
app.use('/api/v1', publicRoutes_1.default); // Allow /api/v1/categories, /api/v1/leaderboard, /api/v1/stats
app.use('/api/v1', userRoutes_1.default); // Mounts /api/v1/me
app.use('/api/v1/uploads', uploadRoutes_1.default);
app.use('/api/v1/requests', requestRoutes_1.default);
app.use('/api/v1/notifications', notificationRoutes_1.default);
app.use('/api/v1/ngo', ngoRoutes_1.default);
app.use('/api/v1/admin', adminRoutes_1.default);
app.use('/api/v1/volunteer', volunteerRoutes_1.default);
app.use('/api/v1/citizen', volunteerRoutes_1.default);
// Mount AI, CivicSetu and Advanced Intelligence Dashboard Routes
app.use('/api/v1/ai', aiRoutes_1.default);
app.use('/api/v1/complaints', aiRoutes_1.default);
app.use('/api/v1/speech', aiRoutes_1.default);
app.use('/api/v1/dashboard', dashboardRoutes_1.default);
app.use('/api/v1/map', dashboardRoutes_1.default);
app.use('/api/v1/verification', dashboardRoutes_1.default);
app.use('/api/v1/milestones', dashboardRoutes_1.default);
app.use('/api/v1/funding', dashboardRoutes_1.default);
app.use('/api/v1/projects', dashboardRoutes_1.default);
app.use('/api/v1/reports', dashboardRoutes_1.default);
// SPA fallback for non-API GET requests: serve index.html if exists
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/actuator')) {
        return res.sendFile(path_1.default.join(publicDir, 'index.html'), (err) => {
            if (err)
                next();
        });
    }
    next();
});
// 404 handler for undefined API routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Cannot ${req.method} ${req.originalUrl}`,
            details: [],
        },
    });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
