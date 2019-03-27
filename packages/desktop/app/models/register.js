import Backbone from 'backbone-associations';

const registry = {};
Backbone.Associations.scopes.push(registry);

export function register(name, model) {
  console.log("registered ", name);
  registry[name] = model;
  return model;
}
