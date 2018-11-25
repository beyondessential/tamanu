const Database = require('../services/database');

class Base extends Database {
  constructor(realm) {
    super(realm);
    // Extend  some properties
    // const properties = ['create'];
    // properties.forEach(property => {
    //   this[property] = super[property]();
    // });
  }
}

module.exports = Base;
