import { Router } from 'express';
// import { setAlarm } from '../controllers/alarmController';
import { setAlarmAck} from '../controllers/alarmController';
import { editAlarm} from '../controllers/alarmController';
import { getAlarmHistory } from '../controllers/alarmController';
import { getAllAlarms,clearOneAlarm,clearAllAlarms,deleteAllAlarmHistories,editAlarmdef, setAlarmDefinition} from '../controllers/alarmController';
import { authenticateUser } from "../lib/authMiddleware";

const router = Router();

// Route to process alarms
// router.post('/setalarm/:projectId', setAlarm);
router.post('/setalarmdef/:projectId',  setAlarmDefinition);
router.post('/:alarmId/acknowledge',authenticateUser, setAlarmAck);
router.get('/history', getAlarmHistory);



router.delete("/:alarmId", clearOneAlarm);

/**
* DELETE /alarms
* Clears all alarms
*/
router.delete("/", clearAllAlarms);

/**
* DELETE /alarms/history
* Deletes all alarm histories
*/
router.delete("/history", deleteAllAlarmHistories);
router.get('/', getAllAlarms);
router.put("/:alarmId", editAlarm);
router.put("/definitions/:alarmDefId", editAlarmdef);
export default router;
