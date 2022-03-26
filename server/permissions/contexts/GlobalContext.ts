import { IUser } from "../../models/user";
import { UserRole } from "../UserRole";
import { PermissionContext } from "./context";

export class GlobalContext implements PermissionContext {
  constructor() {}

  public hasRole(user: IUser, role: UserRole) {
    // Admin is already handled in UserAuth.ts
    return false;
  }
}
