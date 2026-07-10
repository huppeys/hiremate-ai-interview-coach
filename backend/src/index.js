const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const questionsRoutes = require("./routes/questions");
app.use("/api/questions", questionsRoutes);

const sessionsRoutes = require("./routes/sessions");
app.use("/api/sessions", sessionsRoutes);

const profileRoutes = require("./routes/profile");
app.use("/api/profile", profileRoutes);

// Test route
app.get("/api/health", (req, res) => {
  res.json({ message: 'HireMate API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
