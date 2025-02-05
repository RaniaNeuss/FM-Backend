import jwt from "jsonwebtoken";
import { Request, Response,NextFunction  } from "express";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables
declare module "express-serve-static-core" {
    interface Request {
        userId?: string;
    }
}

const JWT_SECRET = process.env.JWT_SECRET as string;



export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
    // 1. Check Session-Based Authentication
    if (req.session && req.session.userId) {
        req.userId = req.session.userId; // Attach userId from session
        return next(); // Call next middleware
    }

    // 2. Check JWT-Based Authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as unknown as { id: string };
            req.userId = decoded.id; // Attach userId from JWT
            return next(); // Call next middleware
        } catch (err) {
            if (err instanceof Error) {
                console.error("Invalid JWT:", err.message);
            } else {
                console.error("Invalid JWT:", err);
            }
            res.status(401).json({ message: "Invalid token" });
            return;
        }
    }

    // 3. If Neither Session Nor JWT Exists
    res.status(401).json({ message: "User is not authenticated" });
};