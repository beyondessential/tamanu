const Backbone = require('backbone-associations');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `user_${_id}`,
      docType: 'user',
      derived_key: null,
      deleted: false,
      displayName: null,
      email: null,
      iterations: [],
      name: null,
      password: null,
      password_scheme: null,
      password_sha: null,
      rev: null,
      roles: [],
      salt: null,
      userPrefix: null,
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
