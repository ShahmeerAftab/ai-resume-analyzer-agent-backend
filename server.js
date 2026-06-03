// Load environment variables from the .env file into process.env
// This MUST be the first import so all files below can access the variables
import "dotenv/config";

import dns from "node:dns";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// Tell Node.js to use Cloudflare (1.1.1.1) and Google (8.8.8.8) DNS servers
// instead of your ISP's default. This prevents failures when resolving
// MongoDB Atlas's special "mongodb+srv://" connection string on some networks.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 5000;

// We use an async function so we can await the database connection BEFORE
// starting the HTTP server — this ensures the DB is ready before any
// requests can arrive.
const startServer = async () => {
  await connectDB(); // Step 1: connect to MongoDB Atlas

  // Step 2: only start listening for requests after the DB is connected
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

startServer();
