import shortid from 'shortid';
import Backbone from 'backbone-associations';

console.log('backbone-associations', Backbone);

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `allergy_${_id}`,
      type: 'allergy',
      name: null,
      icd9CMCode: null,
      icd10Code: null,
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
