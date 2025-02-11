import { Request, Response, RequestHandler } from 'express';
import deviceManager from '../runtime/devices/deviceManager'; // Import deviceManager
import prisma from '../prismaClient'; // Import the Prisma client

import logger from '../runtime/logger';
import axios from 'axios'; // Ensure this is at the top







export const createDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Incoming request body:", req.body); // Log the payload

    const { projectId, name, type, description, property, enabled = true, polling = {} } = req.body;

    // Validate common fields
    if (!name || !projectId) {
      console.error("Device name or projectId is missing.");
      res.status(400).json({ error: "Device name and projectId are required" });
      return;
    }

    // Check for duplicate device
    const existingDevice = await prisma.device.findUnique({ where: { name } });
    if (existingDevice) {
      console.error("Device with the same name already exists.");
      res.status(400).json({ error: "Device with the same name already exists" });
      return;
    }

    // Handle WebAPI-specific logic
    if (type === "WebAPI") {
      console.log("Handling WebAPI device creation logic...");

      const { address, method = "GET", format = "JSON" } = property || {};
      
      // Validate WebAPI-specific fields
      if (!address) {
        console.error("API address is missing in property.");
        res.status(400).json({ error: "API address is required for WebAPI devices" });
        return;
      }

      try {
        // Fetch data from the address and extract tags
        const tags = extractTags(await axios({ url: address, method }).then((res) => res.data));

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

        res.status(201).json(newDevice);
        return;
      } catch (error) {
        console.error("Error fetching data from API:",);
        res.status(500).json({ error: "Failed to fetch data from the API address" });
        return;
      }
    }

    // Handle Generic or other device types
    console.log("Handling Generic or other device creation logic...");

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

    res.status(201).json(newDevice);
  } catch (error) {
    console.error("Error creating device:", error);
    res.status(500).json({ error: "Failed to create device" });
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


  export const editDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params; 
      const { name, description, property, enabled, polling ,type } = req.body; 
  
      const parsedProperty = JSON.stringify(property);
    
      const prevDevice = await prisma.device.findUnique({ where: { id } });
      if (!prevDevice) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
  
      if (name && name !== prevDevice.name) {
        const existingDevice = await prisma.device.findUnique({ where: { name } });
        if (existingDevice) {
          console.error('Device with the same name already exists.');
          res.status(400).json({ error: 'Device with the same name already exists' });
          return;
        }
      }
  
      // Update the device in the database
      const updatedDevice = await prisma.device.update({
        where: { id },
        data: {
          name,
          description,
          property: parsedProperty,
          enabled,
          type,
          polling,
        },
      });
  
      console.log(`Device '${id}' updated in the database.`);
  
      // Handle changes in polling or enabled state
  
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
  





  export const setTankLevel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tankId } = req.params;
        const { name, percentage } = req.body;

        if (!tankId || !name || percentage === undefined) {
            res.status(400).json({ error: "validation_error", message: "Tank ID, tag name, and percentage are required." });
            return;
        }

        // Check if the tank (device) exists
        const device = await prisma.device.findUnique({
            where: { id: tankId },
        });

        if (!device) {
            res.status(404).json({ error: "not_found", message: "Tank (device) does not exist." });
            return;
        }

        // Check if the tag already exists
        let tag = await prisma.tag.findFirst({
            where: { name, deviceId: tankId },
        });

        if (tag) {
            // Update the existing tag
            tag = await prisma.tag.update({
                where: { id: tag.id },
                data: {
                    value: percentage.toString(),
                    type: "number",
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create a new tag if it doesn’t exist
            tag = await prisma.tag.create({
                data: {
                    name,
                    value: percentage.toString(),
                    type: "number",
                    deviceId: tankId, // Ensures foreign key is correct
                },
            });
        }

        res.status(200).json({
            message: "Tank level updated successfully.",
            tag,
        });
    } catch (err: any) {
        console.error(`Failed to set tank level for tank ID: ${req.params.tankId}: ${err.message}`);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while updating tank level." });
    }
};










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
  


 // export const editDeviceAPI = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const { id } = req.params; // Device ID from URL
  //     const { name, description, property, enabled, polling } = req.body; // Update fields
  
  //     const parsedProperty = JSON.stringify(property);
    
  //     // Fetch the previous device details using `id`
  //     const prevDevice = await prisma.device.findUnique({ where: { id } });
  //     if (!prevDevice) {
  //       res.status(404).json({ error: 'Device not found' });
  //       return;
  //     }
  
  //     // Check for duplicate name only if a new `name` is provided
  //     if (name && name !== prevDevice.name) {
  //       const existingDevice = await prisma.device.findUnique({ where: { name } });
  //       if (existingDevice) {
  //         console.error('Device with the same name already exists.');
  //         res.status(400).json({ error: 'Device with the same name already exists' });
  //         return;
  //       }
  //     }
  
  //     // Update the device in the database
  //     const updatedDevice = await prisma.device.update({
  //       where: { id },
  //       data: {
  //         name,
  //         description,
  //         property: parsedProperty,
  //         enabled,
  //         polling,
  //       },
  //     });
  
  //     console.log(`Device '${id}' updated in the database.`);
  
  //     // Handle changes in polling or enabled state
  
  //     res.status(200).json(updatedDevice);
  //   } catch (error) {
  //     console.error('Error editing device:', error);
  //     res.status(500).json({ error: 'Failed to edit device' });
  //   }
  // };