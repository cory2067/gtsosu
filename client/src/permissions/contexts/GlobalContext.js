/**
 * implements PermissionContext
 */
 export class GlobalContext {
  constructor() { }

  hasRoles(user, roles) {
    // Admin is already handled in principal.js
    return false;
  }
}