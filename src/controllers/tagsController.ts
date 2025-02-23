import { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient'; // Import the Prisma client





// export const Createtagtodevice = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Extract deviceId from the URL params and tag details from the request body
//       const { deviceId: deviceId } = req.params;
//       const { address, label, value, type } = req.body;
  
//       // Validate required fields
//       if (!deviceId || !type) {
//         res.status(400).json({ error: 'Missing required fields: deviceId, name, or type' });
//         return;
//       }
  
//       // Save or update the tag in the database
//       const updatedTag = await prisma.tag.upsert({
//         where: {
//           deviceId_address: { deviceId, address }, // Composite key for unique identification
//         },
//         create: {
//           deviceId,
          
//           label,
//           value,
//           type,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         },
//         update: {
//           label,
//           value,
//           type,
//           updatedAt: new Date(),
//         },
//       });
  
//       // Respond with the updated tag
//       res.status(200).json({ message: 'Tag saved successfully', tag: updatedTag });
//     } catch (error) {
//       console.error('Error saving tag to device:', error);
//       res.status(500).json({ error: 'Failed to save tag to device' });
//     }
//   };


  export const saveTagToDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract deviceId from the URL params and tag details from the request body
      const { id: deviceId } = req.params;
      const {  label, value, type,address } = req.body;
  
      // Validate required fields
      if (!deviceId ||  !type) {
        res.status(400).json({ error: 'Missing required fields: deviceId, name, or type' });
        return;
      }
  
      // Save or update the tag in the database
      const updatedTag = await prisma.tag.upsert({
        where: {
          deviceId_address: { deviceId, address }, // Composite key for unique identification
        },
        create: {
          deviceId,
          address,
          label,
          value,
          type,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          label,
          value,
          type,
          updatedAt: new Date(),
        },
      });
  
      // Respond with the updated tag
      res.status(200).json({ message: 'Tag saved successfully', tag: updatedTag });
    } catch (error) {
      console.error('Error saving tag to device:', error);
      res.status(500).json({ error: 'Failed to save tag to device' });
    }
  };


  export const getAllTags = async (req: Request, res: Response): Promise<void> => {
    try {
        const tags = await prisma.tag.findMany();
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
};







export const deleteTag = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if the tag exists
        const existingTag = await prisma.tag.findUnique({ where: { id } });
        if (!existingTag) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        await prisma.tag.delete({ where: { id } });
        res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
};
