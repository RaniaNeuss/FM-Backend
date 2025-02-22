

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create a new Item with variables and tags
 */
export const createItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId } = req.params;
        const { type, name, property, events, actions, label, tagId, variables } = req.body;

        // Validate viewId
        if (!viewId) {
            res.status(400).json({ error: "validation_error", message: "View ID is required." });
            return;
        }

        // Check if the view exists
        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });

        if (!view) {
            res.status(404).json({ error: "not_found", message: "View not found." });
            return;
        }

        // Ensure `variables` is an array
        if (variables && !Array.isArray(variables)) {
            res.status(400).json({ error: "validation_error", message: "Variables must be an array." });
            return;
        }

        // Create item with relations
        const newItem = await prisma.item.create({
            data: {
                viewId,
                type,
                name,
                property: property ? JSON.stringify(property) : null,
                events: events ? JSON.stringify(events) : null,
                actions: actions ? JSON.stringify(actions) : null,
                label,
                tagId,
                variables: {
                    create: variables?.map((variable: { name: string; type: string; value: string }) => ({
                        name: variable.name,
                        type: variable.type,
                        value: variable.value,
                    })),
                },
            },
            include: {
                variables: true,
                tag: true,
            },
        });

        res.status(201).json(newItem);
    } catch (err: any) {
        console.error("Failed to create item:", err.message);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while creating the item." });
    }
};

/**
 * Get all items by view ID with related variables and tags
 */
export const getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId } = req.params;

        if (!viewId) {
            res.status(400).json({ error: "validation_error", message: "View ID is required." });
            return;
        }

        // Fetch all items along with variables and tags
        const items = await prisma.item.findMany({
            where: { viewId },
            include: {
                variables: true,
                tag: true,
            },
        });

        res.status(200).json(items);
    } catch (err: any) {
        console.error("Failed to fetch items:", err.message);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while fetching items." });
    }
};

/**
 * Get a single item by ID with variables and tags
 */
export const getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId, id } = req.params;

        if (!viewId || !id) {
            res.status(400).json({ error: "validation_error", message: "View ID and Item ID are required." });
            return;
        }

        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                variables: true,
                tag: true,
            },
        });

        if (item) {
            res.status(200).json(item);
        } else {
            res.status(404).json({ error: "not_found", message: "Item not found" });
        }
    } catch (err: any) {
        console.error(`Failed to fetch item by ID:: ${err.message}`);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while fetching the item." });
    }
};

/**
 * Update an item, including variables and tag
 */
export const updateItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type, name, property, events, actions, label, tagId, variables } = req.body;

        const updatedItem = await prisma.item.update({
            where: { id },
            data: {
                type,
                name,
                property: property ? JSON.stringify(property) : null,
                events: events ? JSON.stringify(events) : null,
                actions: actions ? JSON.stringify(actions) : null,
                label,
                tagId,
                variables: {
                    deleteMany: {}, // Remove existing variables
                    create: variables?.map((variable: { name: string; type: string; value: string ;property :string }) => ({
                        name: variable.name,
                        type: variable.type,
                        value: variable.value,
                        property: variable.property
                    })),
                },
            },
            include: {
                variables: true,
                tag: true,
            },
        });

        res.status(200).json(updatedItem);
    } catch (err: any) {
        console.error(`Failed to update item by ID:: ${err.message}`);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while updating the item." });
    }
};

/**
 * Delete an item along with its variables
 */
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId, id } = req.params;

        if (!viewId || !id) {
            res.status(400).json({ error: "validation_error", message: "Both view ID and item ID are required." });
            return;
        }

        // Check if the item exists
        const item = await prisma.item.findUnique({
            where: { id },
            include: { variables: true },
        });

        if (!item) {
            res.status(404).json({ error: "not_found", message: "Item not found." });
            return;
        }

        // Delete the item and its variables
        await prisma.item.delete({
            where: { id },
        });

        res.status(200).json({ message: `Item with ID ${id} deleted successfully.` });
    } catch (err: any) {
        console.error(`Failed to delete item: ${err.message}`);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while deleting the item." });
    }
};

/**
 * Delete all items for a view, including their variables
 */
export const deleteAllItemsByViewId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId } = req.params;

        if (!viewId) {
            res.status(400).json({ error: "validation_error", message: "View ID is required." });
            return;
        }

        await prisma.item.deleteMany({
            where: { viewId },
        });

        res.status(200).json({ message: `All items for view ${viewId} have been deleted.` });
    } catch (err: any) {
        console.error(`Failed to delete items: ${err.message}`);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while deleting items." });
    }
};
