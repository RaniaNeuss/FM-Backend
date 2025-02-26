import { Router } from 'express';
// import { setAlarm } from '../controllers/alarmController';
import { setAlarmAck} from '../controllers/alarmController';
import { editAlarm} from '../controllers/alarmController';
import { getAlarmHistory } from '../controllers/alarmController';
import { getAllAlarms,clearOneAlarm,clearAllAlarms,deleteAllAlarmHistories,editAlarmdef, setAlarmDefinition,deleteAlarmDefinition,getAllAlarmDefinitions} from '../controllers/alarmController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';
const router = Router();

//****** Alarm defention routes ************//

router.post('/setalarmdef/:projectId',authenticateUser,authorizeRoles(['SuperAdmin']),  setAlarmDefinition);
router.put("/definitions/:alarmDefId",authenticateUser,authorizeRoles(['SuperAdmin']), editAlarmdef);
router.delete("/definitions/:alarmDefId",authenticateUser,authorizeRoles(['SuperAdmin']), deleteAlarmDefinition);
router.get("/definitions",authenticateUser,authorizeRoles(['SuperAdmin']), getAllAlarmDefinitions);



//********** Active Alarm  routes ********************//

//aknowledge alarm
router.post('/:alarmId/acknowledge',authenticateUser, authorizeRoles(['Operator', 'SuperAdmin']), setAlarmAck);
//get alarm history
router.get('/history',authenticateUser,authorizeRoles(['SuperAdmin']), getAlarmHistory);
//delete all alarm history
router.delete("/history",authenticateUser,authorizeRoles(['SuperAdmin']), deleteAllAlarmHistories);







router.delete("/:alarmId", clearOneAlarm);
router.delete("/", clearAllAlarms);
router.get('/',authenticateUser,authorizeRoles(['SuperAdmin']), getAllAlarms);
router.put("/:alarmId",authenticateUser,authorizeRoles(['SuperAdmin']), editAlarm);
export default router;
