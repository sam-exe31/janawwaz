import { Router } from 'express';
import { publicController } from './publicController';

const router = Router();

router.post('/visit', (req, res, next) => publicController.recordVisit(req, res, next));
router.get('/stats', (req, res, next) => publicController.getStats(req, res, next));
router.get('/feed', (req, res, next) => publicController.getPublicFeed(req, res, next));
router.get('/categories', (req, res, next) => publicController.getCategories(req, res, next));
router.get('/leaderboard', (req, res, next) => publicController.getLeaderboard(req, res, next));
router.get('/ngos/:id/profile', (req, res, next) => publicController.getNgoProfile(req, res, next));

export default router;
