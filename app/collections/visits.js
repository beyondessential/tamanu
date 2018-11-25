import BackboneCollection from './base';
import VisitModel from '../models/visit';

export default BackboneCollection.extend({
  model: VisitModel,
  url: `${BackboneCollection.prototype.url}/vitals`
});
