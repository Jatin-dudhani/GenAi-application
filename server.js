require("dotenv").config();

const express = require("express");
const path = require("path");

const chatRoutes = require("./routes/chat");
const healthRoutes = require("./routes/health");
const conversationRoutes = require("./routes/conversations");

const app = express();

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "connect-src 'self'",
      "img-src 'self' data:",
      "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' https://cdnjs.cloudflare.com"
    ].join("; ")
  );
  next();
});

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/health",
  healthRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);
