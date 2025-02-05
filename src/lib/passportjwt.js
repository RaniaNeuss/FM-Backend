// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcrypt";
// import passport from "passport";
// import { Strategy as LocalStrategy } from "passport-local";
// import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
// import dotenv from "dotenv";

// dotenv.config(); // Load environment variables
// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET ; // Use env variable in production

// // **Local Strategy (Session-Based Login)**
// passport.use(
//   new LocalStrategy(async (username, password, done) => {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { username },
//         include: { groups: true },
//       });

//       if (!user) {
//         return done(null, false, { message: "User not found" });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return done(null, false, { message: "Incorrect password" });
//       }

//       return done(null, user);
//     } catch (error) {
//       return done(error);
//     }
//   })
// );

// // **JWT Strategy (Token-Based Authentication)**
// const jwtOptions = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: JWT_SECRET,
// };

// passport.use(
//   new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
//     try {
//       const user = await prisma.user.findUnique({ where: { id: jwt_payload.id } });
//       if (user) {
//         return done(null, user);
//       } else {
//         return done(null, false);
//       }
//     } catch (error) {
//       return done(error, false);
//     }
//   })
// );

// // **Session Serialization**
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await prisma.user.findUnique({ where: { id } });
//     done(null, user);
//   } catch (error) {
//     done(error);
//   }
// });

// export default passport;
