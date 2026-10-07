const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Faculty = require("./models/Faculty");
const Attendance = require("./models/Attendance");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());

// =========================
// MongoDB Connection
// =========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error);
  });

// =========================
// Test API
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "Employee Attendance API is running"
  });
});

// =========================
// Faculty Register API
// =========================

app.post("/api/faculty/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const existingFaculty = await Faculty.findOne({ email });

    if (existingFaculty) {
      return res.status(400).json({
        message: "Faculty already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = await Faculty.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Faculty registered successfully",
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// =========================
// Faculty Login API
// =========================

app.post("/api/faculty/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const faculty = await Faculty.findOne({ email });

    if (!faculty) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      faculty.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: faculty._id,
        email: faculty.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login successful",
      token
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// =========================
// Mark Attendance API
// =========================

app.post("/api/attendance", auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Present or Absent"
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const existingAttendance = await Attendance.findOne({
      facultyId: req.faculty.id,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already marked for today"
      });
    }

    const attendance = await Attendance.create({
      facultyId: req.faculty.id,
      date: today,
      status
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// =========================
// Get Today's Attendance
// =========================

app.get("/api/attendance/today", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.find({
      date: today
    }).populate("facultyId", "name email");

    res.json({
      date: today,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// =========================
// Get Attendance By Date
// =========================

app.get("/api/attendance/date/:date", auth, async (req, res) => {
  try {
    const { date } = req.params;

    const attendance = await Attendance.find({
      date
    }).populate("facultyId", "name email");

    res.json({
      date,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// =========================
// Start Server
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});