import { UserRoles } from "./roles";
import "./typedefs"

export class Principal {
  /**
   * @type {PermissionContext}
   */
  _context;

  /**
   * @type {User}
   */
  _user;

  /**
   * @param {User} user
   */
  constructor(user) {
    this._user = user;
  }

  /**
   * @param {string} context 
   * @returns 
   */
  inContext(context) {
    this._context = context;
    return this;
  }

  /**
   * @param {string[]} roles 
   */
  hasRole(roles) {
    if (!this._context) {
      throw new Error("Permission context not set");
    }

    // Admin has access to everything
    if (this._user.admin) return true;

    // Host and developers have access to everything(?)
    return this._context.hasRole(this._user, [UserRoles.Host, UserRoles.Developer, ...roles]);
  }
}