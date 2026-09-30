"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = exports.UploadController = void 0;
const fs_1 = __importDefault(require("fs"));
const storageService_1 = require("./storageService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class UploadController {
    async handleUpload(req, res, next) {
        try {
            const files = req.files;
            if (!files || files.length === 0) {
                throw errors_1.AppError.badRequest('At least one file must be provided in the "files" field');
            }
            if (files.length > 5) {
                throw errors_1.AppError.badRequest('Maximum 5 files can be uploaded per request');
            }
            const results = [];
            for (const file of files) {
                const metadata = await storageService_1.storageService.saveFile(file.buffer, file.originalname);
                results.push(metadata);
            }
            return (0, response_1.sendSuccess)(res, results, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async getFile(req, res, next) {
        try {
            const filename = String(req.params.filename);
            const filePath = storageService_1.storageService.getFilePath(filename);
            if (!fs_1.default.existsSync(filePath)) {
                throw errors_1.AppError.notFound('Requested file does not exist');
            }
            return res.sendFile(filePath);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UploadController = UploadController;
exports.uploadController = new UploadController();
