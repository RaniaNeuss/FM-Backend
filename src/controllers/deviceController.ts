import { Request, Response, RequestHandler } from 'express';
import deviceManager from '../runtime/devices/deviceManager'; // Import deviceManager
import prisma from '../prismaClient'; // Import the Prisma client

import logger from '../runtime/logger';
import axios from 'axios'; // Ensure this is at the top



export const createDeviceAPI = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Incoming request body:", req.body); // Log the payload

    const { projectId, name, type = 'WebAPI', description, property, enabled = true, polling = {} } = req.body;
    const { address, method = 'GET', format = 'JSON' } = property || {};

    // Validate address
    if (!address) {
      console.error("API address is missing in property.");
      res.status(400).json({ error: 'API address is required' });
      return;
    }

    // Check for duplicate device
    const existingDevice = await prisma.device.findUnique({ where: { name } });
    if (existingDevice) {
      console.error("Device with the same name already exists.");
      res.status(400).json({ error: 'Device with the same name already exists' });
      return;
    }

    // Extract tags from the API response
    const tags = extractTags(await axios({ url: address, method }).then((res) => res.data));

    // Create the device along with its tags, including the value in tags
    const newDevice = await prisma.device.create({
      data: {
        projectId,
        name,
        type,
        description,
        property: JSON.stringify(property),
        enabled,
        polling,
        createdAt: new Date(),
        updatedAt: new Date(),
        // tags: {
        //   create: tags.map((tag) => ({
        //     name: tag.name,
        //     type: tag.type,
        //     label: tag.label,
        //     // value: tag.value, // Save the value directly in the tags table
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   })),
        // },
      },
      include: { tags: true }, // Include tags to get their IDs
    });

    // Return the newly created device with its tags
    res.status(201).json(newDevice);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device with dynamic tags' });
  }
};






export const createDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Incoming request body:", req.body); // Log the payload

    const { projectId, name, type , description, property, enabled = true, polling = {} } = req.body;


  

    // Check for duplicate device
    const existingDevice = await prisma.device.findUnique({ where: { name } });
    if (existingDevice) {
      console.error("Device with the same name already exists.");
      res.status(400).json({ error: 'Device with the same name already exists' });
      return;
    }


    // Create the device along with its tags, including the value in tags
    const newDevice = await prisma.device.create({
      data: {
        projectId,
        name,
        type,
        description,
        property: JSON.stringify(property),
        enabled,
        polling,
        createdAt: new Date(),
        updatedAt: new Date(),
       
      },
      include: { tags: true }, // Include tags to get their IDs
    });

    // Return the newly created device with its tags
    res.status(201).json(newDevice);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device with dynamic tags' });
  }
};

export const saveTagToDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract deviceId from the URL params and tag details from the request body
    const { id: deviceId } = req.params;
    const { name, label, value, type } = req.body;

    // Validate required fields
    if (!deviceId || !name || !type) {
      res.status(400).json({ error: 'Missing required fields: deviceId, name, or type' });
      return;
    }

    // Save or update the tag in the database
    const updatedTag = await prisma.tag.upsert({
      where: {
        deviceId_name: { deviceId, name }, // Composite key for unique identification
      },
      create: {
        deviceId,
        name,
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






  /**
   * Edit an existing device and update polling/connection behavior dynamically.
   */
  export const editDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, property, enabled, polling } = req.body;
  
      const parsedProperty = JSON.stringify(property);
  
      // Get the previous device details
      const prevDevice = await prisma.device.findUnique({ where: { id } });
      if (!prevDevice) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
          // Check for duplicate device
    const existingDevice = await prisma.device.findUnique({ where: { name } });
    if (existingDevice) {
      console.error("Device with the same name already exists.");
      res.status(400).json({ error: 'Device with the same name already exists' });
      return;
    }
      // Update the device in the database
      const updatedDevice = await prisma.device.update({
        where: { id },
        data: {
          name,
          description,
          property: parsedProperty,
          enabled,
          polling,
        },
      });
  
      console.log(`Device '${id}' updated in the database.`);
  
      // Use the deviceManager to handle changes in polling or enabled state
        await deviceManager.handleDeviceUpdated(updatedDevice, prevDevice);
  
      res.status(200).json(updatedDevice);
    } catch (error) {
      console.error('Error editing device:', error);
      res.status(500).json({ error: 'Failed to edit device' });
    }
  };



  export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
  
      // Find the device to ensure it exists
      const device = await prisma.device.findUnique({
        where: { id },
      });
  
      if (!device) {
        res.status(404).json({ error: `Device with ID '${id}' not found.` });
        return;
      }
  
      // Cascade delete device along with related tags, variables, and data
      await prisma.device.delete({
        where: { id },
      });
  
      res.status(200).json({ message: `Device '${device.name}' deleted successfully.` });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ error: 'Failed to delete device.' });
    }
  };



  export const getAllDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await prisma.device.findMany({
        include: { tags: true },
      });
      res.status(200).json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices.' });
    }
  };
  



  export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
  
      const device = await prisma.device.findUnique({
        where: { id },
        include: {
          tags: true,
        },
      });
  
      if (!device) {
        res.status(404).json({ error: 'Device not found.' });
        return;
      }
  
      res.status(200).json(device);
    } catch (error) {
      console.error('Error fetching device by ID:', error);
      res.status(500).json({ error: 'Failed to fetch device.' });
    }
  };
  



  // function extractTags(data: any, parentKey = ''): any[] {
  //   if (Array.isArray(data)) {
  //     return data.flatMap((item, index) =>
  //       extractTags(item, `${parentKey}[${index}]`)
  //     );
  //   } else if (typeof data === 'object' && data !== null) {
  //     return Object.keys(data).flatMap((key) =>
  //       extractTags(data[key], parentKey ? `${parentKey}.${key}` : key)
  //     );
  //   } else {
  //     return [
  //       {
  //         name: parentKey, // Use parentKey as the unique name
  //         type: typeof data,
  //         value: String(data),
  //       },
  //     ];
  //   }
  // }
  


  function extractTags(data: any, parentKey = ''): any[] {
    if (Array.isArray(data)) {
      return data.flatMap((item, index) =>
        extractTags(item, `${parentKey}[${index}]`)
      );
    } else if (typeof data === 'object' && data !== null) {
      return Object.keys(data).flatMap((key) =>
        extractTags(data[key], parentKey ? `${parentKey}.${key}` : key)
      );
    } else {
      // Extract the label as the last part of the parentKey
      const label = parentKey.split('.').pop()?.replace(/\[\d+\]/g, '') || parentKey;
  
      return [
        {
          name: parentKey, // Full key path
          label, // Last part of the key
          type: typeof data,
          value: String(data),
        },
      ];
    }
  }
  





