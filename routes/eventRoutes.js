const Event = require("../models/Event");
const express = require("express");
const mongoose = require("mongoose");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET ALL EVENTS
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events,
    });
  } catch (error) {
    console.error("Fetch events error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
});

// GET SINGLE EVENT BY ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      event: event,
    });
  } catch (error) {
    console.error("Fetch single event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
});

// CREATE EVENT (ADMIN ONLY)
router.post("/", protect, adminOnly, async (req, res) => {
    try {
        const { title, description, date, location, capacity } = req.body;

        if (!title || !description || !date || !location || capacity == null) {
            return res.status(400).json({
                success: false,
                message: "All event fields are required"
            });
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid future event date"
            });
        }

        const event = await Event.create({
            title,
            description,
            date: parsedDate,
            location,
            capacity: Number(capacity),
            createdBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });
    } catch (error) {
        console.error("Create event error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create event"
        });
    }
});
module.exports = router;