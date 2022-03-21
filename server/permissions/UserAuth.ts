import { IUser } from "../models/user";
import { PermissionContext } from "./contexts/context";
import { UserRole } from "./UserRole";

export class UserAuth {
  protected user: IUser;

  constructor(user: IUser) {
    this.user = user;
  }

  public getUser() {
    return this.user;
  }

  public withContext() {}
}

export class UserAuthWithContext extends UserAuth {
  private context: PermissionContext;
  private hasSuperRole: boolean = false;

  constructor(user: IUser, context: PermissionContext) {
    super(user);
    this.context = context;
    this.hasSuperRole = this.user.admin;
  }

  hasRole(role: UserRole) {
    return this.hasSuperRole || this.context.hasRole(this.user, role);
  }

  hasAllRoles(roles: UserRole[]) {
    return this.hasSuperRole || roles.every((role) => this.context.hasRole(this.user, role));
  }

  hasAnyRole(roles: UserRole[]) {
    return this.hasSuperRole || roles.some((role) => this.context.hasRole(this.user, role));
  }
}
