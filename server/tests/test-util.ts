import mongoose from "mongoose";
import { IUser } from "../models/user";

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

const _mockData: { user: IUser | undefined } = {
  user: undefined,
};

export const logoutMockUser = () => {
  _mockData.user = undefined;
};

export const loginMockUser = (user: IUser) => {
  _mockData.user = user;
};

export const getMockUser = () => _mockData.user;
