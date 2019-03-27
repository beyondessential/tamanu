import Backbone from 'backbone-associations';

const registry = {};
Backbone.Associations.scopes.push(registry);

// Backbone allows defining relations via a unique string ID (usually just
// the name of the model) rather than passing in the model object itself.
// Using this pattern means we can dodge some nasty circular dependency issues,
// but it means we do need to register each model by name as we define it.

export function register(name, model) {
  registry[name] = model;
  return model;
}

// Sometimes we need to access a backbone model without going through
// the backbone internals -- this function allows us to keep using strings.
export function getModel(nameOrModel) {
  // this should be callable with a full model object, which is just a no-op
  if(typeof(nameOrModel) !== "string") {
    return nameOrModel;
  }

  return registry[nameOrModel];
}
