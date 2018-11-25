import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/photo`,
  defaults: () => defaults({
    _id: shortid.generate(),
    caption: null,
    coverImage: false,
    files: {
      attachments: []
    },
    fileName: null,
    isImage: false,
    localFile: false,
    urlRoot:  null,
    // patient: '',
    // visit: '',
    // procedure: ''
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
