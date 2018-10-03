import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/photo`,
  defaults: () => defaults({
    caption: null,
    coverImage: false,
    files: {
      attachments: []
    },
    fileName: null,
    isImage: false,
    localFile: false,
    url: null,
    // patient: '',
    // visit: '',
    // procedure: ''
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
