// src/config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Travel Buddy API",
    version: "1.0.0",
    description: "API documentation for Travel Buddy - A smart travel planning system",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      TripSchedule: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          budget: {
            type: "object",
            properties: {
              flight: { type: "number" },
              hotel: { type: "number" },
              fun: { type: "number" },
            },
          },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                date: { type: "string" },
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string" },
                      name: { type: "string" },
                      cost: { type: "number" },
                      place: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          image: { type: "string" },
          hotelDefault: { type: "object" },
          flightTicket: { type: "object" },
          isPublic: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TripApproval: {
        type: "object",
        properties: {
          _id: { type: "string" },
          tripSchedule: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          admin: { type: "string" },
          reason: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PlaceSummary: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          bookingCount: { type: "number" },
          averageRating: { type: "number" },
        },
      },
      WeeklySales: {
        type: "object",
        properties: {
          total: { type: "number" },
          count: { type: "integer" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          targetType: { type: "string", enum: ["TripSchedule", "Place"] },
          targetId: { type: "string" },
          rating: { type: "number", minimum: 1, maximum: 5 },
          comment: { type: "string" },
          status: { type: "string", enum: ["visible", "hidden"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Report: {
        type: "object",
        properties: {
          _id: { type: "string" },
          reporter: { type: "string" },
          targetType: {
            type: "string",
            enum: ["User", "TripSchedule", "Review", "Place"],
          },
          targetId: { type: "string" },
          reason: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["pending", "reviewed", "resolved"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, "../routes/adminRoutes.js"),
    path.join(__dirname, "../routes/authRoutes.js"),
    path.join(__dirname, "../routes/reportRoutes.js"),
    // apis: [path.join(__dirname, "../routes/*.js")], như này là lấy all
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;