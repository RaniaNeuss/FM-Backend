import { Router } from 'express';
import {
    createFullRfp,getFilteredRfps
    
} from '../controllers/rfpController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';
const router = Router();

// Create a new device
router.post('/create',authenticateUser, createFullRfp); // POST /api/devices/create

router.post('/filter', getFilteredRfps)









export default router;
