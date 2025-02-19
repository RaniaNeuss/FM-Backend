// Import required modules
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { authenticateUser } from "../lib/authMiddleware";





// Controller: Create Project
export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;


        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }

        const { name, description } = req.body;

        if (!name) {
            res.status(400).json({
                error: 'validation_error',
                message: 'Project name is required',
            });
            return;
        }

        // Check if a project with the same name exists
        const existingProject = await prisma.project.findFirst({
            where: { name, userId },
        });

        if (existingProject) {
            res.status(400).json({
                error: 'conflict_error',
                message: 'A project with this name already exists for the user',
            });
            return;
        }

        // Create the project
        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                userId,
            },
        });

        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (err: any) {
        console.error('Error creating project:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while creating the project' });
    }
};


export const assignUsersToProject = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Session Data:', req.session);

        const userId = req.userId; // Logged-in user
        console.log('userId:', userId);

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }

        const { projectId } = req.params;
        const { userIds } = req.body;

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required.' });
            return;
        }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ error: 'validation_error', message: 'User IDs must be a non-empty array.' });
            return;
        }

        // Check if the logged-in user is the owner of the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            res.status(404).json({
                error: 'not_found',
                message: `Project with ID ${projectId} not found.`,
            });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to modify this project.',
            });
            return;
        }

        // Connect new users to the project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                users: {
                    connect: userIds.map((id) => ({ id })), // Add new users
                },
            },
        });

        console.info(`Users added to project ${projectId} successfully.`);
        res.status(200).json({
            message: 'Users assigned to the project successfully.',
            projectId,
            addedUsers: userIds,
        });
    } catch (err: any) {
        console.error(`Failed to assign users to project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while assigning users to the project.',
        });
    }
};


// Controller: Get Users by Project ID
export const getUsersByProjectId = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Session Data:', req.session);

        const userId = req.userId; // Logged-in user
        console.log('userId:', userId);

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }

        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({
                error: 'validation_error',
                message: 'Project ID is required.',
            });
            return;
        }

        // Check if the logged-in user has access to the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                users: true, // Include users assigned to the project
            },
        });

        if (!project) {
            res.status(404).json({
                error: 'not_found',
                message: `Project with ID ${projectId} not found.`,
            });
            return;
        }

       

        const assignedUsers = project.users;

        console.info(`Fetched users assigned to project ${projectId} successfully.`);
        res.status(200).json({
            projectId,
            assignedUsers,
        });
    } catch (err: any) {
        console.error(`Failed to fetch users for project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching users for the project.',
        });
    }
};

// Controller: Edit Assigned Users in a Project (Replace Existing Users)
export const editAssignedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId; // Logged-in user
        const { projectId } = req.params;
        const { userIds } = req.body; // New list of user IDs to assign

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required.' });
            return;
        }

        if (!Array.isArray(userIds)) {
            res.status(400).json({ error: 'validation_error', message: 'User IDs must be an array.' });
            return;
        }

        // Check if the logged-in user is the owner of the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found.' });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to edit assigned users in this project.',
            });
            return;
        }

        // Update assigned users (replace existing users with the new list)
        await prisma.project.update({
            where: { id: projectId },
            data: {
                users: {
                    set: [], // Remove all existing users
                    connect: userIds.map((id) => ({ id })), // Add new users
                },
            },
        });

        console.info(`Updated assigned users for project ${projectId}.`);
        res.status(200).json({
            message: 'Assigned users updated successfully.',
            projectId,
            updatedUsers: userIds,
        });
    } catch (err: any) {
        console.error(`Failed to edit assigned users for project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while editing assigned users.',
        });
    }
};

// Controller: Remove Assigned Users from a Project
export const removeAssignedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId; // Logged-in user
        const { projectId } = req.params;
        const { userIds } = req.body; // List of users to remove

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required.' });
            return;
        }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ error: 'validation_error', message: 'User IDs must be a non-empty array.' });
            return;
        }

        // Check if the logged-in user is the owner of the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found.' });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to remove users from this project.',
            });
            return;
        }

        // Remove users from the project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                users: {
                    disconnect: userIds.map((id) => ({ id })), // Remove specific users
                },
            },
        });

        console.info(`Removed users from project ${projectId}.`);
        res.status(200).json({
            message: 'Users removed successfully.',
            projectId,
            removedUsers: userIds,
        });
    } catch (err: any) {
        console.error(`Failed to remove users from project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while removing users from the project.',
        });
    }
};


// Controller: Fetch All Projects
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in.' });
            return;
        }

        // Fetch projects owned by the user or where the user is assigned
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { userId: userId }, // Projects owned by the user
                    { users: { some: { id: userId } } }, // Projects the user is assigned to
                ],
            },
        });

        console.info(`Fetched all projects for userId: ${userId}`);
        res.status(200).json(projects);
    } catch (err: any) {
        console.error(`Failed to fetch projects for userId ${req.userId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching projects.',
        });
    }
};


// Controller: Fetch Project by ID

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Retrieve userId from session
        const userId = req.userId;
        // Validate that both ID and userId exist
        if (!id || !userId) {
            console.warn('Project ID or User ID is missing in request or session');
            res.status(400).json({
                error: 'validation_error',
                message: 'Both Project ID and User must be logged in',
            });
            return;
        }

        // Fetch the project associated with the given ID and userId
        const project = await prisma.project.findFirst({
            where: {
                id: id,
                OR: [
                    { userId: userId }, // Fetch if the user is the owner
                    { users: { some: { id: userId } } }, // Fetch if the user is assigned
                ],
            },
            include: {
                alarms: true,
                devices: true,
                reports: true,
                scripts: true,
                texts: true,
                events: true,
                views: true,
            },
        });

        if (project) {
            console.info(`Fetched project with ID: ${id} for userId: ${userId}`);
            res.status(200).json(project);
        } else {
            console.warn(`Project not found with ID: ${id} for userId: ${userId}`);
            res.status(404).json({
                error: 'not_found',
                message: 'Project not found for the given user',
            });
        }
    } catch (err: any) {
        console.error(
            `Failed to fetch project by ID: ${req.params.id} for userId from session: ${err.message}`
        );
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching the project.',
        });
    }
};

// Controller: Update Project Data
export const updateProjectData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Project ID
        const userId = req.userId; // Logged-in user ID
        const { data } = req.body; // Data to update

        // Validate that ID, userId, and data exist
        if (!id || !userId || !data) {
            console.warn('Project ID, User ID, or data is missing in request or session');
            res.status(400).json({
                error: 'validation_error',
                message: 'Project ID, User must be logged in, and data is required',
            });
            return;
        }

        // Fetch the project and include its owner and assigned users
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                users: true, // Include assigned users
            },
        });

        // Check if the project exists
        if (!project) {
            console.warn(`Project not found with ID: ${id}`);
            res.status(404).json({
                error: 'not_found',
                message: `Project with ID ${id} not found.`,
            });
            return;
        }

        // Verify if the logged-in user is either the project owner or an assigned user
        const isOwner = project.userId === userId;
        const isAssignedUser = project.users.some((user) => user.id === userId);

        if (!isOwner && !isAssignedUser) {
            console.warn(`User ID: ${userId} does not have permission to update project ID: ${id}`);
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to update this project.',
            });
            return;
        }

        // Update project data
        const updatedProject = await prisma.project.update({
            where: { id },
            data,
        });

        console.info(`Updated project with ID: ${id} for userId: ${userId}`);
        res.status(200).json({
            message: 'Project updated successfully',
            project: updatedProject,
        });
    } catch (err: any) {
        console.error('Failed to update project data:', err.message);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while updating the project.',
        });
    }
};





export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Validate that both ID and userId exist
        if (!id || !userId) {
            console.warn('Project ID or User ID is missing in request or session');
            res.status(400).json({
                error: 'validation_error',
                message: 'Both Project ID and User must be logged in',
            });
            return;
        }

        // Delete the project associated with the given ID and userId
        const deletedProject = await prisma.project.deleteMany({
            where: {
                id: id,
                userId: userId,
            },
        });

        if (deletedProject.count > 0) {
            console.info(`Deleted project with ID: ${id} for userId: ${userId}`);
            res.status(200).json({ message: 'Project deleted successfully' });
        } else {
            console.warn(`Project not found with ID: ${id} and userId: ${userId}`);
            res.status(404).json({ error: 'not_found', message: 'Project not found for the given user' });
        }
    } catch (err: any) {
        console.error(`Failed to delete project by ID: ${req.params.id} for userId from session: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while deleting the project.',
        });
    }
};








function handleError(res: Response, err: any, context: string): void {
    if (err && err.code) {
         console.error(`${context}: ${err.message}`);
        res.status(400).json({ error: err.code, message: err.message });
    } else {
         console.error(`${context}: ${err}`);
        res.status(400).json({ error: 'unexpected_error', message: err });
    }
}