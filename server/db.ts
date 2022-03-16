import mongoose from "mongoose";
import pino from "pino";
const logger = pino();

const srv =
  process.env.NODE_ENV === "production" ? process.env.MONGO_SRV : process.env.DEV_MONGO_SRV;

export default {
  init: () => {
    // connect to mongodb
    return mongoose
      .connect(srv, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      })
      .then(() => logger.info("Server connected to MongoDB"))
      .catch((err) => logger.error("Error connecting to MongoDB", err));
  },
  getConnection: () => mongoose.connection,
};
