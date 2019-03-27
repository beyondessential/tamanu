import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('Photo', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/photo`,
  defaults: () => defaults({
    caption: null,
    coverImage: false,
    files: {
      attachments: [],
    },
    fileName: null,
    isImage: false,
    localFile: false,
    urlRoot: null,
    // patient: '',
    // visit: '',
    // procedure: ''
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
