import mongoose from "mongoose";

export const setup = () => {
  // wait for mongodb to connect before running test suite
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (mongoose.connection.db) {
        clearInterval(interval);
        return resolve({});
      }
    }, 100);
  });
};

export const teardown = () => {
  mongoose.disconnect();
};
