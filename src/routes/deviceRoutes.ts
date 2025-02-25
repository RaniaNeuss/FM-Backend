import { Router } from 'express';
import {
    createDevice,
     editDevice,deleteDevice,getDeviceById,getAllDevices,setTankLevel,testWebAPIConnection,deleteManyDevices,deleteAllDevices
} from '../controllers/deviceController';

const router = Router();

// Create a new device
router.post('/create', createDevice); // POST /api/devices/create
router.post("/testconnection", testWebAPIConnection);

router.post('/tank/:tankId', setTankLevel);
// Edit an existing device
 router.put('/:id', editDevice); // PUT /api/devices/edit/:id
// 
 router.get('/', getAllDevices); 
 router.get('/:id', getDeviceById); 

 router.delete('/delete-many', deleteManyDevices); 
 router.delete('/remove-all', deleteAllDevices);
 router.delete('/:id', deleteDevice);












export default router;
