import BackboneCollection from './base';

export default BackboneCollection.extend({
  model: 'Visit',
  url: `${BackboneCollection.prototype.url}/vitals`,
});
