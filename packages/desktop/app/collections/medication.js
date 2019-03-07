import Backbone from 'backbone-associations';

import { MedicationModel } from '../models';
import BaseCollection from './base';

import {
  dbViews
} from '../constants';

export default BaseCollection.extend({
  model: MedicationModel,
  url: `${BaseCollection.prototype.url}/medication`,

  getPage(page, view, viewKeys, options = {}) {
    const { pageSize } = options;
    if (pageSize) this.state.pageSize = pageSize;

    // omit view keys from base class as they're causing bugs
    const requestFulfilled = (view === dbViews.medicationFulfilled);
    options.data = { 
      status: requestFulfilled ? 'Fulfilled' : 'Requested',
    };

    return Backbone.PageableCollection.prototype.getPage.apply(this, [page, options]);
  },

});
