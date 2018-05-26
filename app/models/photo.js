const Backbone = require('backbone');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `photo_${_id}`,
      type: 'photo',
      caption: null,
      coverImage: false,
      files: {
        attachments: []
      },
      fileName: null,
      isImage: false,
      localFile: false,
      url: null,

      // Associations
      patient: '',
      visit: '',
      procedure: ''
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
