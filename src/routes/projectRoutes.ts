import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectData,
  assignUsersToProject,       // New: Edit assigned users
  removeAssignedUsers,
  deleteProject,getUsersByProjectId,inviteUsers,getUnassignedUsers
 
} from '../controllers/projectController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';

const router = Router();

// Fetch all projects
router.get('/getprojects',authenticateUser, getAllProjects); // GET /api/projects

// Fetch a project by ID
router.get('/:id',authenticateUser, getProjectById); // GET /api/projects/:id
// Edit (Replace) Assigned Users in a Project

// Remove Specific Users from a Project
router.delete('/:projectId/removeusers',authenticateUser,authorizeRoles(['SuperAdmin']), removeAssignedUsers);

// Create a new project
router.post('/create',authenticateUser,authorizeRoles(['SuperAdmin']), createProject); // POST /api/projects

// Update specific project data
router.put('/:id',authenticateUser, updateProjectData); // POST /api/projects/data

router.get('/:projectId/users',authenticateUser,authorizeRoles(['SuperAdmin']), getUsersByProjectId);

router.post('/:projectId/assignusers',authenticateUser,authorizeRoles(['SuperAdmin']), assignUsersToProject);
router.get('/:projectId/unassignedusers',authenticateUser,authorizeRoles(['SuperAdmin']), getUnassignedUsers);
router.post('/:projectId/inviteusers',authenticateUser,authorizeRoles(['SuperAdmin']), inviteUsers);

// Delete a project by ID
router.delete('/:id',authenticateUser,authorizeRoles(['SuperAdmin']), deleteProject); // DELETE /api/projects/:id




























// Get device property
// router.get('/device', getDeviceProperty); // GET /api/projects/device

// Update device property
// router.post('/device', updateDeviceProperty); // POST /api/projects/device

// Upload a file
// router.post('/upload', uploadFile); // POST /api/projects/upload

export default router;
