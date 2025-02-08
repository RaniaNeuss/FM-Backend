import { Router } from 'express';
import {
    createDevice,createDeviceAPI,
     editDevice,deleteDevice,getDeviceById,getAllDevices,saveTagToDevice
} from '../controllers/deviceController';

const router = Router();

// Create a new device
router.post('/create', createDevice); // POST /api/devices/create
router.post('/createapi', createDeviceAPI); // POST /api/devices/create
// Edit an existing device
 router.put('/:id', editDevice); // PUT /api/devices/edit/:id
// 
 router.get('/', getAllDevices); 
 router.get('/:id', getDeviceById); 

 router.delete('/:id', deleteDevice);
 router.post('/:id/tags', saveTagToDevice);










export default router;
