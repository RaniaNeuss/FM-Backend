import { Router } from 'express';
import {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
    deleteAllItemsByViewId
} from '../controllers/itemController';

const router = Router();

// Create a new item
router.post('/:viewId', createItem); // POST /api/items

// Fetch all items
router.get('/:viewId', getAllItems); // GET /api/items

// Fetch an item by ID
router.get('/:viewId/:id', getItemById); // GET /api/items/:viewId/:id

// Update an item by ID
router.put('/:viewId/:id', updateItem); // PUT /api/items/:id

// Delete an item by ID
router.delete('/:viewId/:id', deleteItem); // DELETE /api/items/:id


router.delete('/:viewId/', deleteAllItemsByViewId);


export default router;