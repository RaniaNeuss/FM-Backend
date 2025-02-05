import { Router } from 'express';
import {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification
} from '../controllers/notificationController';

const router = Router();

// Create a new notification
router.post('/:projectId', createNotification); // POST /api/notifications

// Fetch all notifications
router.get('/:projectId', getAllNotifications); // GET /api/notifications

// Fetch a notification by ID
router.get('/:id', getNotificationById); // GET /api/notifications/:id

// Update a notification by ID
router.put('/:projectId/:id', updateNotification); // PUT /api/notifications/:id

// Delete a notification by ID
router.delete('/:projectId/:id', deleteNotification); // DELETE /api/notifications/:id

export default router;