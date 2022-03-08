// Should be removed after migrating to typescript
/**
 * @typedef {Object} Role
 * @property {string} role
 * @property {string} tourney
 * 
 * @typedef {Object} Stat
 * @property {string} tourney
 * @property {string} seedName
 * @property {number} seedNum
 * @property {string} group
 * @property {Date} regTime
 * 
 * @typedef User
 * @property {string} username
 * @property {string} userid
 * @property {string} country
 * @property {string} avatar
 * @property {string} discord
 * @property {number} timezone
 * @property {number} rank
 * @property {boolean} admin
 * @property {Role[]} roles
 * @property {Stat[]} stats
 * @property {string[]} tournies
 * 
 * @callback HasRoles
 * @param {User} user
 * @param {string[]} roles
 * @returns {boolean}
 * 
 * @typedef PermissionContext // Should be an interface after migrating to typescript
 * @property {HasRoles} hasRoles
 */