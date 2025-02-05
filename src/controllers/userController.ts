
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_SECRET } from "../lib/config";
import { User as PrismaUser } from "@prisma/client";
declare global {
    namespace Express {
        interface User extends PrismaUser {}
    }
}









// Controller: Create User
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        
        // Debug: Log session details
        console.log('Session Data:', req.session);

        // Retrieve userId from session
         const userId = req.userId;        console.log('userId:', userId);

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }
        // Validate request body
        const { username, email, name, password, group } = req.body;

        if (!username || typeof username !== "string") {
            console.warn("Validation failed: username is missing or invalid");
            res.status(400).json({ error: "validation_error", message: "Valid username is required" });
            return;
        }

        if (!name || typeof name !== "string") {
            console.warn("Validation failed: name is missing or invalid");
            res.status(400).json({ error: "validation_error", message: "Valid name is required" });
            return;
        }
        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
             console.warn("Validation failed: email is missing or invalid");
            res.status(400).json({ error: "validation_error", message: "Valid email is required" });
            return;
        }

        if (!password || typeof password !== "string" || password.length < 6) {
             console.warn("Validation failed: password is missing or too short");
            res.status(400).json({ error: "validation_error", message: "Password must be at least 6 characters long" });
            return;
        }

        if (!group || typeof group !== "string") {
             console.warn("Validation failed: group is missing or invalid");
            res.status(400).json({ error: "validation_error", message: "Valid group is required" });
            return;
        }

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
             console.warn(`User creation failed: email "${email}" already exists`);
            res.status(409).json({ error: "conflict_error", message: `email "${email}" is already taken` });
            return;
        }

        // Check if the group exists
        const existingGroup = await prisma.group.findUnique({ where: { name: group } });
        if (!existingGroup) {
             console.warn(`User creation failed: group "${group}" does not exist`);
            res.status(404).json({ error: "not_found", message: `Group "${group}" does not exist` });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                name,
                password: hashedPassword,
                groups: {
                    connect: [{ id: existingGroup.id }],
                },
            },
        });

         console.info(`User created successfully: ${newUser.username}`);
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                name:  newUser.name,
                username: newUser.username,
                email: newUser.email,
                group: existingGroup.name,
            },
        });
    } catch (err: any) {
        console.error(`Failed to create user: ${err.message}`);
        handleError(res, err, "api create user");
    }
};

// Controller: Sign in User




export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            res.status(400).json({ message: "email and password are required" });
            return;
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { email },
            include: { groups: true },
        });

        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        
        // Generate Access Token (short-lived, stored in localStorage on the frontend)
        const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "15m" } // 15 minutes
        );

        // Generate Refresh Token (long-lived, stored in an HTTP-only cookie)
        const refreshToken = jwt.sign(
            { id: user.id },
            REFRESH_SECRET,
            { expiresIn: "7d" } // 7 days
        );

        console.log("Refresh Token Set:", refreshToken);


        // Store the user ID in the session for session-based login
        req.session.userId = user.id;

        
        // Set refresh token as a secure HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Set secure flag in production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });


        console.log("Refresh Token Set:", refreshToken);


        // Send access token to frontend for localStorage
        res.status(200).json({
            message: "User logged in successfully",
            accessToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
            email: user.email,
            groups: user.groups?.map((group) => group.name),
        });
    } catch (err: any) {
        console.error("Failed to log in:", err.message);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred during login" });
    }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        console.error("Refresh token not provided");
        res.status(401).json({ message: "Refresh token not provided" });
        return;
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
        console.log("Token successfully verified for user ID:", decoded.id);

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { id: decoded.id },
            JWT_SECRET,
            { expiresIn: "15m" } // 15 minutes
        );

        

        res.status(200).json({
            accessToken: newAccessToken,
            expiresIn: 15 , // 15 minutes in seconds
        });
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            console.error("Refresh token expired:", err.message);
            res.status(401).json({ message: "Refresh token expired. Please log in again." });
        } else {
            console.error("Failed to refresh access token:", (err as Error).message);
            res.status(403).json({ message: "Invalid refresh token" });
        }
    }
};






export const authStatus = async (req: Request, res: Response): Promise<void> => {
    console.log("User in session:", req.user);
    if (req.isAuthenticated()) {
        res.status(200).json({
            message: "User logged in successfully",
            email: (req.user as any).email, // Use 'as any' or type your 'req.user' properly
        });
    } else {
        res.status(401).json({ message: "Unauthorized user" });
    }
};



export const logout = (req: Request, res: Response): void => {
    req.logout((err) => {
        if (err) {
            res.status(500).json({ message: "Failed to log out" });
            return;
        }

        // Destroy the session
        req.session.destroy(() => {
            // Clear the refresh token cookie
            res.clearCookie("refreshToken");
             res.clearCookie("connect.sid");
            res.status(200).json({ message: "User logged out successfully" });
        });
    });
};




// Controller: Get all Users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Debug: Log session details
        console.log('Session Data:', req.session);

        // Retrieve userId from session
         const userId = req.userId;       
          console.log('userId:', userId);

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }

        const users = await prisma.user.findMany({
            include: { groups: true },
        });
         console.info("Fetched all users successfully");
        res.status(200).json(users);
    } catch (err: any) {
        console.error("api get users: " + err.message);
        handleError(res, err, "api get users");
    }
};

// Controller: Get User by ID
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
       

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
        const userId = req.userId;    
        console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }

        const user = await prisma.user.findUnique({ where: { id: String(userId) } });
         console.info("Fetched all users successfully");
        res.status(200).json(user);
    } catch (err: any) {
        console.error("api get user: " + err.message);
        handleError(res, err, "api get user");
    }
};



// Controller: Edit User
export const editUser = async (req: Request, res: Response): Promise<void> => {
    try {
   

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
        const userId = req.userId;   
            console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }        const { name, email, info } = req.body; // Retrieve the fields to update from the request body

        // Validate `id`
        if (!userId) {
            res.status(400).json({
                error: "validation_error",
                message: "User ID is required.",
            });
            return;
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: {  id: String(userId) },
        });

        if (!user) {
            res.status(404).json({
                error: "not_found",
                message: `User with ID ${userId} not found.`,
            });
            return;
        }

        // Validate `name`
        if (name && typeof name !== "string") {
            res.status(400).json({
                error: "validation_error",
                message: "Name must be a valid string.",
            });
            return;
        }

        // Validate `email`
        if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            res.status(400).json({
                error: "validation_error",
                message: "Email must be a valid email address.",
            });
            return;
        }

        // Validate `info`
        if (info && typeof info !== "string") {
            res.status(400).json({
                error: "validation_error",
                message: "Info must be a valid string.",
            });
            return;
        }

        // Update the user in the database
        const updatedUser = await prisma.user.update({
            where: {  id: String(userId) },
            data: {
                name,
                email,
                info,
                updatedAt: new Date(),
            },
        });

        res.status(200).json({
            message: "User updated successfully.",
            user: updatedUser,
        });
    } catch (err: any) {
        console.error(`Failed to edit user with ID ${req.params.id}: ${err.message}`);
        res.status(500).json({
            error: "unexpected_error",
            message: "An error occurred while updating the user.",
        });
    }
};



// Controller: Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
    

          

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
        const userId = req.userId;       console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: {  id: String(userId) } });
        if (!existingUser) {
             console.warn(`User with ID ${userId} not found`);
            res.status(404).json({ error: "not_found", message: "User not found" });
            return;
        }

        await prisma.user.delete({ where: { id: String(userId) } });
         console.info(`User deleted successfully: ${userId}`);
        res.status(204).end();
    } catch (err: any) {
        console.error("api delete users: " + err.message);
        handleError(res, err, "api delete users");
    }
};

// Controller: Get all Groups
export const getGroups = async (req: Request, res: Response): Promise<void> => {
    try {
          

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
        const userId = req.userId;       console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }

        const groups = await prisma.group.findMany();
         console.info("Fetched all groups successfully");
        res.status(200).json(groups);
    } catch (err: any) {
        console.error("api get groups: " + err.message);
        handleError(res, err, "api get groups");
    }
};

// Controller: Create Group
export const createGroup = async (req: Request, res: Response): Promise<void> => {
    try {
          

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
        const userId = req.userId;       console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }

        const { name } = req.body;

        // Check if the group already exists
        const existingGroup = await prisma.group.findUnique({ where: { name } });
        if (existingGroup) {
            console.warn(`Group creation failed: group "${name}" already exists`);
            res.status(409).json({ error: "conflict_error", message: `Group "${name}" already exists` });
            return;
        }

        const newGroup = await prisma.group.create({
            data: { name },
        });

        console.info(`Group created successfully: ${newGroup.name}`);
        res.status(201).json(newGroup);
    } catch (err: any) {
        console.error("api post groups: " + err.message);
        handleError(res, err, "api post groups");
    }
};

// Controller: Delete Group by ID
export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
    try {
   
          

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
        const userId = req.userId;       console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }

        await prisma.group.delete({ where: { id: String(userId) } });
        console.info(`Group deleted successfully: ${userId}`);
        res.status(204).end();
    } catch (err: any) {
        console.error("api delete groups: " + err.message);
        handleError(res, err, "api delete groups");
    }
};



function handleError(res: Response, err: any, context: string): void {
    if (err && err.code) {
        res.status(400).json({ error: err.code, message: err.message });
        console.error(`${context}: ${err.message}`);
    } else {
        res.status(400).json({ error: "unexpected_error", message: err });
        console.error(`${context}: ${err}`);
    }
}


// export const login = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { email, password } = req.body;

//         // Validate email and password
//         if (!email || !password) {
//             res.status(400).json({ message: "Email and password are required" });
//             return;
//         }

//         // Check if the user exists
//         const user = await prisma.user.findUnique({
//             where: { email },
//             include: { groups: true },
//         });

//         if (!user) {
//             res.status(401).json({ message: "Invalid email or password" });
//             return;
//         }

//         // Verify the password
//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             res.status(401).json({ message: "Invalid email or password" });
//             return;
//         }

//         // Generate Access Token (short-lived, stored in localStorage on the frontend)
//         const accessToken = jwt.sign(
//             { id: user.id, email: user.email },
//             JWT_SECRET,
//             { expiresIn: "15m" } // 15 minutes
//         );

//         // Generate Refresh Token (long-lived, stored in an HTTP-only cookie)
//         const refreshToken = jwt.sign(
//             { id: user.id },
//             REFRESH_SECRET,
//             { expiresIn: "7d" } // 7 days
//         );

//         console.log("Refresh Token Set:", refreshToken);

//         // Store the user ID in the session for session-based login
//         req.session.userId = user.id;

//         // Set refresh token as a secure HTTP-only cookie
//         res.cookie("refreshToken", refreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production", // Set secure flag in production
//             sameSite: "strict",
//             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//         });

//         console.log("Refresh Token Set:", refreshToken);

//         // Send access token to frontend for localStorage
//         res.status(200).json({
//             message: "User logged in successfully",
//             accessToken,
//             expiresIn: 15 * 60, // 15 minutes in seconds
//             email: user.email,
//             groups: user.groups?.map((group) => group.name),
//         });
//     } catch (err: any) {
//         console.error("Failed to log in:", err.message);
//         res.status(500).json({ error: "unexpected_error", message: "An error occurred during login" });
//     }
// };
