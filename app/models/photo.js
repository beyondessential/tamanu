const PhotoSchema = {
  name: 'photo',
  properties: {
    caption: {
      type: 'string',
      optional: true
    },
    coverImage: {
      type: 'bool',
      default: false
    },
    attachments: 'string[]',
    fileName: {
      type: 'string',
      optional: true
    },
    isImage: {
      type: 'bool',
      default: false
    },
    localFile: {
      type: 'bool',
      default: false
    },
    url: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = PhotoSchema;
