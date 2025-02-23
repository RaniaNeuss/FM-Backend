import { Router } from 'express';
import {
    createDevice,
     editDevice,deleteDevice,getDeviceById,getAllDevices,setTankLevel,
} from '../controllers/deviceController';

const router = Router();

// Create a new device
router.post('/create', createDevice); // POST /api/devices/create
router.post('/tank/:tankId', setTankLevel);
// Edit an existing device
 router.put('/:id', editDevice); // PUT /api/devices/edit/:id
// 
 router.get('/', getAllDevices); 
 router.get('/:id', getDeviceById); 

 router.delete('/:id', deleteDevice);
//  router.post('/:id/tags', saveTagToDevice);

//  router.put("/:deviceId/tags/:tagName", updateTagValue);









export default router;
