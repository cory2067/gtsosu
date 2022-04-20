import mongoose from "mongoose";
import pino from "pino";
const logger = pino();

const srv =
  process.env.NODE_ENV === "production" ? process.env.MONGO_SRV! : process.env.DEV_MONGO_SRV!;

const options = process.env.NODE_ENV === "test" ? { dbName: "test-tmp" } : {};

export default {
  init: async () => {
    try {
      await mongoose.connect(srv, options);
      logger.info("Server connected to MongoDB");
      return mongoose.connection.getClient();
    } catch (err) {
      logger.error("Error connecting to MongoDB", err);
      throw err;
    }
  },
};
