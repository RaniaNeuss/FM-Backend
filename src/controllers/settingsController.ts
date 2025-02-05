import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create Settings
export const createSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { system, smtp, daqstore, alarms } = req.body; // Extract settings data from request body
        const { projectId } = req.params; // Get projectId from params
        const userId = req.userId;
        if (!userId  ) {
            res.status(400).json({
                error: 'validation_error',
                message: 'User must be logged in',
            });
            return;
        }

        // Validate project existence
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found.' });
            return;
        }

        // Check if settings already exist for the project
        const existingSettings = await prisma.settings.findUnique({
            where: { projectId }
        });

        if (existingSettings) {
            res.status(400).json({ error: 'duplicate_entry', message: 'Settings already exist for this project.' });
            return;
        }

        // Create settings in the database
        const newSettings = await prisma.settings.create({
            data: {
                projectId,
                system: JSON.stringify(system || {}),
                smtp: JSON.stringify(smtp || {}),
                daqstore: JSON.stringify(daqstore || {}),
                alarms: JSON.stringify(alarms || {}),
            }
        });

        res.status(201).json({
            message: 'Settings created successfully.',
            settings: newSettings
        });
    } catch (err: any) {
        console.error('Failed to create settings:', err);

        // Check for Prisma-specific errors (e.g., invalid foreign key references)
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'not_found', message: 'Related entity not found.' });
        } else {
            res.status(500).json({
                error: 'unexpected_error',
                message: 'An error occurred while creating the settings.'
            });
        }
    }
};


// Get All Settings for a Project
export const getAllSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId  ) {
            res.status(400).json({
                error: 'validation_error',
                message: 'User must be logged in',
            });
            return;
        }      
        
        const { projectId } = req.params;
         const existingproject = await prisma.project.findFirst({
            where: {
                id:projectId
            },
        });
        
        if (!existingproject) {
        res.status(400).json({
            error: 'validation_error',
            message: 'Project does not exist',
        });
        return;
        }
        const settings = await prisma.settings.findMany({
            where: { projectId }
        });
        res.status(200).json(settings);
    } catch (err: any) {
        console.error('Failed to fetch settings:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching settings.' });
    }
};

// Get Settings by ID for a Project
export const getSettingsById = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId  ) {
            res.status(400).json({
                error: 'validation_error',
                message: 'User must be logged in',
            });
            return;
        }
        const { projectId, id } = req.params;
        const settings = await prisma.settings.findUnique({
            where: { id, projectId }
        });
        if (settings) {
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'not_found', message: 'Settings not found' });
        }
    } catch (err: any) {
        console.error(`Failed to fetch settings by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching the settings.' });
    }
};





// Update Settings for a Project
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {const userId = req.userId;
        if (!userId  ) {
            res.status(400).json({
                error: 'validation_error',
                message: 'User must be logged in',
            });
            return;
        }
        const { projectId, id } = req.params;
        const { system, smtp, daqstore, alarms } = req.body;

        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found.' });
            return;
        }

        // Check if settings exist
        const existingSettings = await prisma.settings.findUnique({
            where: { id, projectId }
        });

        if (!existingSettings) {
            res.status(404).json({ error: 'not_found', message: 'Settings not found.' });
            return;
        }

        const updatedSettings = await prisma.settings.update({
            where: { id, projectId },
            data: {
                system: JSON.stringify(system),
                smtp: JSON.stringify(smtp),
                daqstore: JSON.stringify(daqstore),
                alarms: JSON.stringify(alarms)
            }
        });
        res.status(200).json(updatedSettings);
    } catch (err: any) {
        console.error(`Failed to update settings by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while updating the settings.' });
    }
};

// Delete Settings for a Project
export const deleteSettings = async (req: Request, res: Response): Promise<void> => {
    try {const userId = req.userId;
        if (!userId  ) {
            res.status(400).json({
                error: 'validation_error',
                message: 'User must be logged in',
            });
            return;
        }
        const { projectId, id } = req.params;
        await prisma.settings.delete({
            where: { id, projectId }
        });
        res.status(200).json({ message: 'Settings deleted successfully' });
    } catch (err: any) {
        console.error(`Failed to delete settings by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while deleting the settings.' });
    }
};