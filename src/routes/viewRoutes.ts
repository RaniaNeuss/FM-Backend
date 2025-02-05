import { Router } from 'express';
import {
    createView,
    getAllViews,
    getViewById,
    updateView,
    deleteView
} from '../controllers/viewController';
import { authenticateUser } from "../lib/authMiddleware";

const router = Router();

// Create a new view
router.post('/:projectId',authenticateUser, createView); // POST /api/views

// Fetch all views
router.get('/:projectId',authenticateUser, getAllViews); // GET /api/views

// Fetch a view by ID
router.get('/:projectId/:id',authenticateUser, getViewById); // GET /api/views/:projectId/:id

// Update a view by ID
router.put('/:projectId/:id',authenticateUser, updateView); // PUT /api/views/:id

// Delete a view by ID
router.delete('/:projectId/:id',authenticateUser, deleteView); // DELETE /api/views/:id

export default router;