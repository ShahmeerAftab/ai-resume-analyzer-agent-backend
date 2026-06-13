import mongoose from "mongoose";

// reuse the existing connection on serverless cold-start reuse — connecting
// again on every request would be slow and can exhaust Atlas connections
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // stop waiting after 5 seconds if Atlas is unreachable
  });

  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
