import { Router } from 'express';
import { setAlarm } from '../controllers/alarmController';
import { setAlarmAck} from '../controllers/alarmController';
import { clearAlarms } from '../controllers/alarmController';
import { getAlarmHistory } from '../controllers/alarmController';
import { getAllAlarms } from '../controllers/alarmController';
import { authenticateUser } from "../lib/authMiddleware";

const router = Router();

// Route to process alarms
router.post('/setalarm/:projectId', setAlarm);
router.post('/:alarmId/acknowledge',authenticateUser, setAlarmAck);
router.post('/clear', clearAlarms);
router.get('/history', getAlarmHistory);
router.get('/', getAllAlarms);

export default router;
