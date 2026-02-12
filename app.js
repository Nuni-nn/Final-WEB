const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const commentRoutes = require("./routes/commentRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const User = require("./models/User");

const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/auth", authRoutes);
app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/recipes", recipeRoutes);
app.use("/categories", categoryRoutes);
app.use("/comments", commentRoutes);
app.use("/favorites", favoriteRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use(errorHandler);

(async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME || "Admin";

    if (adminEmail && adminPassword) {
      const existing = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!existing) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await User.create({
          username: adminUsername,
          email: adminEmail.toLowerCase(),
          passwordHash,
          role: "admin",
        });
        console.log("Admin user created from env");
      } else {
        let changed = false;

        if (existing.role !== "admin") {
          existing.role = "admin";
          changed = true;
        }

        const passwordMatches = await bcrypt.compare(adminPassword, existing.passwordHash);
        if (!passwordMatches) {
          existing.passwordHash = await bcrypt.hash(adminPassword, 10);
          changed = true;
        }

        if (changed) {
          await existing.save();
          console.log("Admin user synced from env");
        }
      }
    }
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
})();

module.exports = app;
