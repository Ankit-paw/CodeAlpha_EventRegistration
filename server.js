// ===================================
// EVENTIFY SERVER
// ===================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

const app = express();

// ===================================
// CORS CONFIGURATION
// ===================================

const corsOptions = {
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// CORS must be registered before API routes
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// ===================================
// HOME ROUTE
// ===================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Eventify API is running!"
    });
});

// ===================================
// API ROUTES
// ===================================

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);

// ===================================
// START SERVER
// ===================================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, "127.0.0.1", () => {
            console.log(`Eventify server running at http://127.0.0.1:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();