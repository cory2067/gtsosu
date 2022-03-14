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
 * @typedef {Object} Stage
 * @property {string} name
 * @property {boolean} poolVisible
 * @property {string} mappack
 * 
 * @typedef {Object} Tournament
 * @property {string} code
 * @property {boolean} registrationOpen
 * @property {boolean} teams
 * @property {Stage[]} stages
 * @property {number} rankMin
 * @property {number} rankMax
 * @property {string[]} countries
 * @property {string[]} flags
 * 
 * @typedef {Object} Match
 * @property {string} player1
 * @property {string} player2
 * @property {string} warmup1
 * @property {string} warmup2
 * @property {string} code
 * @property {Date} time
 * @property {number} score1
 * @property {number} score2
 * @property {string} link
 * @property {string} referee
 * @property {string} streamer
 * @property {string[]} commentators
 * @property {string} tourney
 * @property {string} stage
 * 
 * @typedef {Object} Team
 * @property {string} name
 * @property {string} country
 * @property {User[]} players
 * @property {string} icon
 * @property {string} tourney
 * @property {string} seedName
 * @property {number} seedNum
 * @property {string} group
 * 
 * @callback HasRole
 * @param {User} user
 * @param {string} role
 * @returns {boolean}
 * 
 * @typedef PermissionContext // Should be an interface after migrating to typescript
 * @property {HasRole} hasRole
 */