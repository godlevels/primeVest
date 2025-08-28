// mongodb.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/investment_platform';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');

  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process on failure
  }
};

export default connectDB;
// This file handles the MongoDB connection setup for the investment platform.
// It uses Mongoose to connect to the database and exports the connection function for use in the application.
// The connection URI is read from environment variables, with a fallback to a local MongoDB instance.