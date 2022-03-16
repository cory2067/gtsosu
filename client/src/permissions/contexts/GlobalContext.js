/**
 * implements PermissionContext
 */
 export class GlobalContext {
  constructor() { }

  hasRole(user, role) {
    // Admin is already handled in principal.js
    return false;
  }
}