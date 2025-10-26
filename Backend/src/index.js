// src/index.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import placesRoutes from "./routes/placesRoutes.js";
import routingRoutes from "./routes/routingRoutes.js";
import tripScheduleRoutes from "./routes/tripScheduleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import dotenv from "dotenv";
import { connectToMongoDB } from "./lib/db.js";
import session from "express-session";
import sessionConfig from "./config/sessionConfig.js";
import { jwtPassport, verifyAdmin, verifyUser } from "./config/jwtConfig.js";
import methodOverride from "method-override";

dotenv.config();

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

app.use(session(sessionConfig));
app.use(jwtPassport.initialize());
app.use(express.json());
app.use(cors());

// Tích hợp Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/AI", aiRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/routing", routingRoutes);
app.use("/api/tripSchedule", tripScheduleRoutes);
app.use("/api/admin", adminRoutes);

const port = 3000;
app.listen(port, () => {
  connectToMongoDB();
  console.log(`API server is running at http://localhost:${port}`);
  console.log(`Swagger UI is available at http://localhost:${port}/api-docs`);
});