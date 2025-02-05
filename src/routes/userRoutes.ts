import { Router } from 'express';
import { getUsers,refreshAccessToken, createUser, deleteUser, getGroups, createGroup, deleteGroup, getUser, login , authStatus ,logout,editUser } from '../controllers/userController';
import passport from "passport";
import jwt from "jsonwebtoken";
import session from 'express-session';
import { JWT_SECRET, REFRESH_SECRET } from "../lib/config";

import { authenticateUser } from "../lib/authMiddleware";



import { Request, Response, NextFunction } from "express";

declare module "express-session" {
    interface SessionData {
        userId: string; // Add userId as a string
        projectId: string;
        viewId: string;
    }
}

interface User {
    id: string;
    username: string;
    password: string;
    name: string | null;
    email: string;
    info: string | null;
    createdAt: Date;
    updatedAt: Date; 
  }
const router = Router();
// Role routes
router.get('/groups',authenticateUser, getGroups);
router.post('/groups',authenticateUser, createGroup);
router.delete('/groups/:id',authenticateUser, deleteGroup);

// User routes
router.get('/',authenticateUser, getUsers);
router.post('/',authenticateUser, createUser);
router.delete('/:id',authenticateUser, deleteUser);
router.get('/:id',authenticateUser, getUser);
router.put('/',authenticateUser, editUser);



router.post("/refreshAccessToken", async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
         res.status(401).json({ message: "Refresh token not provided" });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string) as { id: string };

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET as string,
            { expiresIn: "15m" } // 15 minutes
        );

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: "Invalid refresh token" });
    }
});








// router.post("/login", (req: Request, res: Response, next: NextFunction) => {
//     passport.authenticate(
        
//         "local",
//         (err: Error | null, user: User | false, info: { message: string }) => {
//             if (err) {
//                 return res.status(500).json({ message: "Internal error" });
//             }

//             if (!user) {
//                 return res.status(401).json({ message: info?.message || "Invalid credentials" });
//             }

//             req.logIn(user, (loginErr) => {
//                 if (loginErr) {
//                     return res.status(500).json({ message: "Login error" });
//                 }

//                  // **Session for Web Clients**
//                 req.session.userId = user.id; // Store userId in the session


//                 // Generate JWT Token for Mobile Clients
//                 const accessToken = jwt.sign(
//                     { id: user.id, username: user.username },
//                     process.env.JWT_SECRET as string,
//                     { expiresIn: "15m" } 
//                 );

//                 const refreshToken = jwt.sign(
//                     { id: user.id },
//                     REFRESH_SECRET,
//                     { expiresIn: "7d" } // 7 days
//                 );

//         // **Set Refresh Token in HTTP-Only Cookie (Web Only)**
//                     res.cookie("refreshToken", refreshToken, {
//                     httpOnly: true,
//                     secure: process.env.NODE_ENV === "production", // Use secure cookies in production
//                     sameSite: "strict",
//                     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//                 });
//                 // **Response for Mobile**
//                 res.status(200).json({
//                     message: "Logged in successfully",
//                     user,
//                     accessToken, 
//                     refreshToken,
//                     expiresIn: 15 * 60,
                      
//                 });
//             });
//         }
//     )(req, res, next);
// });

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (err: Error | null, user: User | false, info: { message: string }) => {
        if (err) {
          return res.status(500).json({ message: "Internal error" });
        }
  
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
  
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Login error" });
          }
  
          // **Session for Web Clients**
          req.session.userId = user.id; // Store userId in the session
  
          // Generate JWT Token for Mobile Clients
          const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: "15m" }
          );
  
          const refreshToken = jwt.sign(
            { id: user.id },
            REFRESH_SECRET,
            { expiresIn: "7d" }
          );
  
          // **Set Refresh Token in HTTP-Only Cookie (Web Only)**
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
  
          // **Response for Mobile**
          res.status(200).json({
            message: "Logged in successfully",
            user,
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
          });
        });
      }
    )(req, res, next);
  });
  


router.post("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: "Logout error" });

        req.session.destroy((destroyErr) => {
            if (destroyErr) return res.status(500).json({ message: "Error logging out" });
            res.clearCookie("connect.sid"); // Clear the session cookie
            res.clearCookie("refreshToken");
            res.json({ message: "Logged out successfully" });
        });
    });
});


// Check authentication status
router.get('/auth/status', authStatus);





export default router;





