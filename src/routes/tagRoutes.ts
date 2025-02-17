import express from 'express';
import { getAllTags, deleteTag, Createtagtodevice } from '../controllers/tagsController';

const router = express.Router();

router.get('/', getAllTags);
router.delete('/:id', deleteTag);
 router.post('/:deviceId',  Createtagtodevice);
export default router;