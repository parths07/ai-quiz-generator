import mongoose from 'mongoose'

/**
 * MongoDB Connection Utility for Next.js
 * 
 * This utility provides a cached MongoDB connection to prevent
 * creating multiple connections in serverless environments.
 * 
 * Why caching is important:
 * - In development, Next.js hot-reloading can create multiple connections
 * - In production (Vercel/serverless), each function invocation could create new connections
 * - MongoDB has connection limits, so reusing connections is crucial
 * 
 * How it works:
 * 1. Store connection in global scope (persists across hot-reloads in dev)
 * 2. Check if connection exists before creating a new one
 * 3. Reuse existing connection when available
 */

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI

// Validate that MONGODB_URI is defined
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

/**
 * Global cache for MongoDB connection
 * Using global ensures the connection persists across hot-reloads in development
 * and across function invocations in serverless environments
 */
let cached = global.mongoose

// Initialize cache if it doesn't exist
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

/**
 * Connect to MongoDB with connection caching
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
async function connectDB() {
  // If we already have a connection, return it immediately
  if (cached.conn) {
    return cached.conn
  }

  // If we don't have a connection promise, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering to fail fast
    }

    // Create connection promise and cache it
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('  MongoDB connected successfully')
      return mongoose
    })
  }

  try {
    // Wait for the connection promise to resolve
    cached.conn = await cached.promise
  } catch (e) {
    // If connection fails, clear the promise so we can retry
    cached.promise = null
    console.error('  MongoDB connection error:', e.message)
    throw e
  }

  return cached.conn
}

export default connectDB
