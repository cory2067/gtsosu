/**
 * implements PermissionContext
 */
 export class GlobalContext {
  constructor() { }

  hasRole(user, roles) {
    // Admin is already handled in principal.js
    return false;
  }
}