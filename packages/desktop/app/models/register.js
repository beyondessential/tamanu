import Backbone from 'backbone-associations';

const registry = {};
Backbone.Associations.scopes.push(registry);

export function register(name, model) {
  console.log("registered ", name);
  registry[name] = model;
  return model;
}

export function getModel(nameOrModel) {
  // this should be callable with a full model object, which is just a no-op
  if(typeof(nameOrModel) !== "string") {
    return nameOrModel;
  }

  return registry[nameOrModel];
}
