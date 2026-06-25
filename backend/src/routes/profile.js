const express = require("express");
const router = express.Router();

router.post("/setup", async (req, res) => {
  try {
    const { name, educationLevel, targetRole, targetIndustry } = req.body;

    if (!name || !educationLevel || !targetRole || !targetIndustry) {
      return res.status(400).json({
        message: "All profile fields are required",
      });
    }

    res.status(200).json({
      message: "Profile saved successfully",
      profile: {
        name,
        educationLevel,
        targetRole,
        targetIndustry,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to save profile",
      error: error.message,
    });
  }
});

module.exports = router;