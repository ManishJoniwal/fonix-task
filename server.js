const express = require("express");
const logger = require("./middlewares/logger");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const app = express();
app.use(express.json());
app.use(logger);
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
app.use(cors());
app.use(helmet());

const dotenv = require("dotenv");
dotenv.config();

const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");

async function main() {
  await mongoose.connect(process.env.mongoURI);
}
main()
  .then(() => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log("errr in db", err.message);
  });

// console.log("hello")
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);

// error handler
app.use((err, req, res, next) => {
  console.error("error", err.message);
  res
    .status(500)
    .json({ message: "interval server error", error: err.require });
});
app.listen(3000, () => {
  console.log("server is running on port 3000");
});
