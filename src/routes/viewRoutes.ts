import { Router } from 'express';
import {
    createView,
    getAllViews,
    getViewById,
    updateView,
    deleteView
} from '../controllers/viewController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';

const router = Router();

// Create a new view
router.post('/:projectId', createView); // POST /api/views
// router.post('/:projectId',authenticateUser,authorizeRoles(['SuperAdmin']), createView); // POST /api/views

// Fetch all views
router.get('/:projectId', getAllViews); // GET /api/views
// router.get('/:projectId',authenticateUser, authorizeRoles(['Operator', 'SuperAdmin']), getAllViews); // GET /api/views

// Fetch a view by ID
router.get('/:projectId/:id', getViewById); // GET /api/views/:projectId/:id
// router.get('/:projectId/:id',authenticateUser, authorizeRoles(['Operator', 'SuperAdmin']), getViewById); // GET /api/views/:projectId/:id

// Update a view by ID
router.put('/:projectId/:id', updateView); // PUT /api/views/:id
// router.put('/:projectId/:id',authenticateUser,authorizeRoles(['SuperAdmin']), updateView); // PUT /api/views/:id

// Delete a view by ID
router.delete('/:projectId/:id', deleteView); // DELETE /api/views/:id
// router.delete('/:projectId/:id',authenticateUser,authorizeRoles(['SuperAdmin']), deleteView); // DELETE /api/views/:id

export default router;




