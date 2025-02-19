import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectData,
  assignUsersToProject, editAssignedUsers,       // New: Edit assigned users
  removeAssignedUsers,
  deleteProject,getUsersByProjectId,
 
} 

from '../controllers/projectController';
import { authenticateUser } from "../lib/authMiddleware";

const router = Router();

// Fetch all projects
router.get('/getprojects',authenticateUser, getAllProjects); // GET /api/projects

// Fetch a project by ID
router.get('/:id',authenticateUser, getProjectById); // GET /api/projects/:id
// Edit (Replace) Assigned Users in a Project
router.put('/:projectId/editusers', authenticateUser, editAssignedUsers);

// Remove Specific Users from a Project
router.delete('/:projectId/removeusers', authenticateUser, removeAssignedUsers);

// Create a new project
router.post('/create',authenticateUser, createProject); // POST /api/projects

// Update specific project data
router.put('/:id',authenticateUser, updateProjectData); // POST /api/projects/data

router.get('/:projectId/users',authenticateUser, getUsersByProjectId);

router.post('/:projectId/assignusers',authenticateUser, assignUsersToProject);


// Delete a project by ID
router.delete('/:id',authenticateUser, deleteProject); // DELETE /api/projects/:id




























// Get device property
// router.get('/device', getDeviceProperty); // GET /api/projects/device

// Update device property
// router.post('/device', updateDeviceProperty); // POST /api/projects/device

// Upload a file
// router.post('/upload', uploadFile); // POST /api/projects/upload

export default router;
