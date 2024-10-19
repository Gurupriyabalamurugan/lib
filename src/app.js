const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const path = require("path"); // Import path module
const { apiV1 } = require("./routes");
const { connectDb } = require("./db");
const { UserModel } = require("./models/user");

const app = express();

// Middleware setup
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the views directory

// Session management
app.use(
  sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: true,
  })
);

// API routes
app.use("/v1", apiV1);

// Define a route to render an EJS template
app.get("/", (req, res) => {
  res.render("index"); // Renders the index.ejs file from the views directory
});

// 404 Error handling
app.use((req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

// General error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  return res.status(500).json({ error: "Unknown server error" });
});

// Connect to the database and start the server
connectDb()
  .then(async () => {
    const admin = await UserModel.findOne({ username: "admin" });
    if (admin == null) {
      await UserModel.create({ username: "admin", password: "admin", role: "admin" });
    }
    const guest = await UserModel.findOne({ username: "guest" });
    if (guest == null) {
      await UserModel.create({ username: "guest", password: "guest", role: "guest" });
    }
  })
  .then(() => {
    app.listen(8080, () => console.log("Server is listening on http://localhost:8080"));
  })
  .catch((err) => {
    console.error("Failed to connect to database", err);
    process.exit(1);
  });
