require("dotenv").config();

const express = require("express");
const path = require("path");

const chatRoutes = require("./routes/chat");
const healthRoutes = require("./routes/health");

const app = express();

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.use("/api/chat", chatRoutes);
app.use("/health", healthRoutes);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running on port ${PORT}`
  );
});