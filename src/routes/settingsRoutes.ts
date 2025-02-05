import { Router } from 'express';
import {
    createSettings,
    getAllSettings,
    getSettingsById,
    updateSettings,
    deleteSettings
} from '../controllers/settingsController';
import { authenticateUser } from "../lib/authMiddleware";

const router = Router();

// Create new settings for a project
router.post('/:projectId',authenticateUser, createSettings); // POST /api/settings/:projectId

// Fetch all settings for a project
router.get('/:projectId',authenticateUser, getAllSettings); // GET /api/settings/:projectId

// Fetch settings by ID for a project
router.get('/:projectId/:id',authenticateUser, getSettingsById); // GET /api/settings/:projectId/:id

// Update settings by ID for a project
router.put('/:projectId/:id',authenticateUser, updateSettings); // PUT /api/settings/:projectId/:id

// Delete settings by ID for a project
router.delete('/:projectId/:id',authenticateUser, deleteSettings); // DELETE /api/settings/:projectId/:id

export default router;