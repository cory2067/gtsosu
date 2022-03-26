import { IUser } from "../../models/user";
import { UserRole } from "../UserRole";

export interface PermissionContext {
  hasRole: (user: IUser, role: UserRole) => boolean;
}
