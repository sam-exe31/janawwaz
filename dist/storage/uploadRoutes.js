"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = require("./uploadController");
const authMiddleware_1 = require("../auth/authMiddleware");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authenticate, authMiddleware_1.requireNotSuspended, upload.array('files', 5), (req, res, next) => uploadController_1.uploadController.handleUpload(req, res, next));
// File serving endpoint
router.get('/files/:filename', (req, res, next) => uploadController_1.uploadController.getFile(req, res, next));
exports.default = router;
