import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};
// Passport JWT strategy
passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      console.log("JWT Payload:", jwt_payload);

      const user = await User.findById(jwt_payload.userId);
      if (user) return done(null, user); // gán user vào req.user
      else return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);

export const generateJWT = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      facebookId: user.facebookId,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "5h" }
  );
};

// Middleware để dùng trực tiếp thay vì passport.authenticate('jwt')
export const verifyUser = (req, res, next) => {
  // console.log("Verify user token: ", req.session.token);

  const authHeader =
    req.headers["authorization"] || `Bearer ${req.session.token}`;

  const token = authHeader && authHeader.split(" ")[1]; // 'Bearer <token>'
  console.log("TOKEN USER", token);
  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }
  // console.log("token verify: ", token);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token!" });
    }
    req.user = decoded;
    next();
  });
};

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZkZWVmMWM4ZmI3NGI5NTNlZWNiZDUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjI1MzAxNTYsImV4cCI6MTc2MjU0ODE1Nn0.tKCWKSNOxcBl8BA3BAZn2cQpx9Fd8IjjGCR1Q1_qP14

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1]; // 'Bearer <token>'
  if (!token) {
    console.log("No token provided");
    return res.status(403).json({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log("Token:", token);
    console.log("Decoded:", decoded);
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(401).json({ message: "Invalid token!" });
    }

    if (decoded.role !== "admin") {
      console.log("User role:", decoded.role);
      return res.status(403).json({ message: "Admin access required." });
    }

    req.user = decoded;
    next();
  });
};

export const verifySupporter = (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || `Bearer ${req.session.token}`;

  const token = authHeader && authHeader.split(" ")[1]; // 'Bearer <token>'
  console.log("TOKEN SUPPORT", token);
  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token!" });

    if (decoded.role !== "support") {
      console.log("User role:", decoded.role);
      return res.status(403).json({ message: "Suport access required." });
    }

    req.user = decoded;
    next();
  });
};

export const jwtPassport = passport;
