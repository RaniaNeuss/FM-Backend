import express from 'express';
import { getAllTags, deleteTag, saveTagToDevice} from '../controllers/tagsController';

const router = express.Router();

router.get('/', getAllTags);
router.delete('/:id', deleteTag);
 router.post('/:id/tags',  saveTagToDevice);
export default router;