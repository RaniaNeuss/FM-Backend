import { Router } from 'express';
import { setAlarm } from '../controllers/alarmController';
import { acknowledgeAlarm } from '../controllers/alarmController';
import { clearAlarms } from '../controllers/alarmController';
import { getAlarmHistory } from '../controllers/alarmController';
import { getAllAlarms } from '../controllers/alarmController';

const router = Router();

// Route to process alarms
router.post('/setalarm/:projectId', setAlarm);
router.post('/acknowledge', acknowledgeAlarm);
router.post('/clear', clearAlarms);
router.get('/history', getAlarmHistory);
router.get('/', getAllAlarms);

export default router;
