const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// Connect to MongoDB - handle serverless environment
if (process.env.NODE_ENV !== 'production') {
  connectDB();
} else {
  // In production, connect on-demand for serverless
  connectDB().catch(console.error);
}

app.use(cors({
  origin: ['https://construction-management-system-xqif.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/equipment", require("./routes/equipmentRoutes"));
app.use("/api/materials", require("./routes/materialRoutes"));
app.use("/api/material-requests", require("./routes/materialRequestRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/blueprints", require("./routes/blueprintRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));

app.use(errorHandler);

module.exports = app;