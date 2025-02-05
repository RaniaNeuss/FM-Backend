import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// Create Notification
export const createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        const { name, receiver, type, delay = 1, interval = 0, enabled = false, subscriptions } = req.body;

        // Check if the project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found' });
            return;
        }

        const newNotification = await prisma.notification.create({
            data: {
                projectId,
                name,
                receiver,
                type,
                delay,
                interval,
                enabled,
                subscriptions: JSON.stringify(subscriptions)
            }
        });
        res.status(201).json(newNotification);
    } catch (err: any) {
        console.error('Failed to create notification:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while creating the notification.' });
    }
};

// Get All Notifications
export const getAllNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        // Check if the project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found' });
            return;
        }

        const notifications = await prisma.notification.findMany({
            where: { projectId }
        });
        res.status(200).json(notifications);
    } catch (err: any) {
        console.error('Failed to fetch notifications:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching notifications.' });
    }
};

// Get Notification by ID
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.findUnique({
            where: { id }
        });
        if (notification) {
            res.status(200).json(notification);
        } else {
            res.status(404).json({ error: 'not_found', message: 'Notification not found' });
        }
    } catch (err: any) {
        console.error(`Failed to fetch notification by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching the notification.' });
    }
};

// Update Notification
export const updateNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, id } = req.params;
        const { name, receiver, type, delay, interval, enabled, subscriptions } = req.body;

        // Check if the project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found' });
            return;
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: {
                name,
                receiver,
                type,
                delay,
                interval,
                enabled,
                subscriptions: JSON.stringify(subscriptions)
            }
        });
        res.status(200).json(updatedNotification);
    } catch (err: any) {
        console.error(`Failed to update notification by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while updating the notification.' });
    }
};

// Delete Notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, id } = req.params;

        // Check if the project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found' });
            return;
        }

        await prisma.notification.delete({
            where: { id }
        });
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (err: any) {
        console.error(`Failed to delete notification by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while deleting the notification.' });
    }
};