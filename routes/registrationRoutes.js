const express = require("express");
const mongoose = require("mongoose");

const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { protect } = require("../middleware/auth");

const router = express.Router();

// REGISTER FOR AN EVENT
router.post("/:eventId", protect, async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Registration for this event is closed",
      });
    }

    const existingRegistration = await Registration.findOne({
      user: req.user.id,
      event: eventId,
    });

    if (existingRegistration) {
      if (existingRegistration.status === "registered") {
        return res.status(409).json({
          success: false,
          message: "Already registered for this event",
        });
      }

      // Reactivate a previously cancelled registration
      existingRegistration.status = "registered";

      await existingRegistration.save();

      return res.status(200).json({
        success: true,
        message: "Registration restored successfully",
        registration: existingRegistration,
      });
    }

    // Atomically reserve one available seat
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        $expr: { $lt: ["$registeredCount", "$capacity"] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(409).json({
        success: false,
        message: "Event is full",
      });
    }

    try {
      const registration = await Registration.create({
        user: req.user.id,
        event: eventId,
      });

      return res.status(201).json({
        success: true,
        message: "Event registration successful",
        registration,
      });
    } catch (error) {
      // Roll back seat count if registration creation fails
      await Event.updateOne(
        { _id: eventId },
        { $inc: { registeredCount: -1 } }
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Already registered for this event",
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to register for event",
    });
  }
});

// GET MY REGISTRATIONS
router.get("/my/list", protect, async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user.id,
      status: "registered",
    }).populate("event");

    return res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
});

// CANCEL MY REGISTRATION
router.delete("/:registrationId", protect, async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.isValidObjectId(registrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration ID",
      });
    }

    const registration = await Registration.findOneAndUpdate(
      {
        _id: registrationId,
        user: req.user.id,
        status: "registered",
      },
      { $set: { status: "cancelled" } },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Active registration not found",
      });
    }

    await Event.updateOne(
      {
        _id: registration.event,
        registeredCount: { $gt: 0 },
      },
      { $inc: { registeredCount: -1 } }
    );

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Cancellation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
    });
  }
});

module.exports = router;