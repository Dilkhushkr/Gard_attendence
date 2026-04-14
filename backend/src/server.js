const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./db/connectDb");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;
// const allowedOrigins = [process.env.USER_HOST, process.env.ADMIN_HOST].filter(Boolean);

// app.use(
//   cors({
//     origin: allowedOrigins.length ? allowedOrigins : true
//   })
// );
// app.use(express.json());

const allowedOrigins = [
  process.env.USER_HOST,
  process.env.ADMIN_HOST
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.get("/api/health", (_, res) => {
  res.json({ ok: true, message: "Backend healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

async function startServer() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
