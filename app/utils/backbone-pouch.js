/*
 * backbone-pouch
 */

import Backbone from 'backbone-associations';
import _ from 'underscore';

const BackbonePouch = {};

const methodMap = {
  create: 'post',
  update: 'put',
  patch: 'put',
  delete: 'remove'
};

BackbonePouch.defaults = {
  fetch: 'allDocs',
  listen: false,
  options: {
    post: {},
    put: {},
    get: {},
    remove: {},
    allDocs: {},
    query: {},
    spatial: {},
    changes: {
      continuous: true
    }
  }
};

// inspired from https://github.com/Raynos/xtend
function extend() {
  const target = {};

  for (let i = 0; i < arguments.length; i++) {
    const source = arguments[i];

    if (typeof source !== 'object') {
      continue;
    }

    for (let name in source) {
      if (source[name] && target[name] && typeof source[name] === 'object' && typeof target[name] === 'object' && name !== 'db') {
        target[name] = extend(target[name] || {}, source[name]);
      } else {
        target[name] = source[name];
      }
    }
  }

  return target;
}

// backbone-pouch sync adapter
BackbonePouch.sync = (defaults) => {
  defaults = defaults || {};
  defaults = extend(BackbonePouch.defaults, defaults);

  const adapter = async (method, model, options) => {
    options = options || {};
    options = extend(defaults, model && model.pouch || {}, options);

    // This is to get the options (especially options.db)
    // by calling model.sync() without arguments.
    if (typeof method !== 'string') {
      return options;
    }

    // ensure we have a pouch db adapter
    if (!options.db) {
      throw new Error('A "db" property must be specified');
    }

    const callback = async (err, response) => {
      if (err) {
        return options.error && options.error(err);
      }

      if (method === 'create' || method === 'update' || method === 'patch') {
        response = {
          _id: response.id,
          _rev: response.rev
        };
      }

      if (method === 'delete') {
        response = {};
      }

      if (method === 'read') {
        if (options.listen && (model instanceof Backbone.Collection)) {
          // TODO:
          // * implement for model
          // * allow overwriding of since.
          _.result(options, 'db').info((err, info) => {
            // get changes since info.update_seq
            _.result(options, 'db').changes(_.extend({}, options.options.changes, {
              since: info.update_seq,
              onChange: (change) => {
                const todo = model.get(change.id);

                if (change.deleted) {
                  if (todo) {
                    todo.destroy();
                  }
                } else {
                  if (todo) {
                    todo.set(change.doc);
                  } else {
                    model.add(change.doc);
                  }
                }

                // call original onChange if present
                if (typeof options.options.changes.onChange === 'function') {
                  options.options.changes.onChange(change);
                }
              }
            }));
          });
        }
      }

      return options.success && options.success(response);
    };

    model.trigger('request', model, _.result(options, 'db'), options);
    if (method === 'read') {
      // get single model
      if (model.id) {
        return _.result(options, 'db').get(model.id, options.options.get, callback);
      }

      // query view or spatial index
      if (options.fetch === 'query' || options.fetch === 'spatial') {
        if (!options.options[options.fetch].fun) {
          throw new Error(`A "${options.fetch}.fun" object must be specified`);
        }
        return _.result(options, 'db')[options.fetch](
          options.options[options.fetch].fun,
          options.options[options.fetch]
        ).then((resp) => {
          callback(null, resp);
        }).catch((err) => {
          callback(err);
        });
      }

      // query view or spatial index
      if (options.fetch === 'find') {
        try {
          const func = _.result(options, 'db');
          const resp = await func[options.fetch](options.options[options.fetch]);
          return callback(null, { rows: resp.docs, total_rows: resp.docs.length });
        } catch (err) {
          callback(err);
        }
      }

      // allDocs or spatial query
      _.result(options, 'db')[options.fetch](options.options[options.fetch], callback);
    } else {
      _.result(options, 'db')[methodMap[method]](model.toJSON(), options.options[methodMap[method]], callback);
    }

    return options;
  };

  adapter.defaults = defaults;

  return adapter;
};

BackbonePouch.attachments = (defaults) => {
  defaults = defaults || {};

  function getPouch(model) {
    if (model.pouch && model.pouch.db) {
      return _.result(model.pouch, 'db');
    }
    if (model.collection && model.collection.pouch && model.collection.pouch.db) {
      return _.result(model.collection.pouch, 'db');
    }

    if (defaults.db) {
      return _.result(defaults, 'db');
    }

    const options = model.sync();
    if (options.db) {
      return _.result(options, 'db');
    }

    // TODO: ask sync adapter

    throw new Error('A "db" property must be specified');
  }

  return {
    attachments: (filter) => {
      const atts = this.get('_attachments') || {};
      if (filter) {
        return _.filter(_.keys(atts), (key) => {
          if (typeof filter === 'function') {
            return filter(key, atts[key]);
          }

          return atts[key].content_type.match(filter);
        });
      }
      return _.keys(atts);
    },
    attachment: (name, done) => {
      // TODO: first look at the _attachments stub,
      // maybe there the data is already there
      const db = getPouch(this);
      return db.getAttachment(this.id, name, done);
    },
    attach: (blob, name, type, done) => {
      if (typeof name === 'function') {
        done = name;
        name = undefined;
        type = undefined;
      }
      if (typeof type === 'function') {
        done = type;
        type = undefined;
      }
      name = name || blob.filename;
      type = type || blob.type;

      const db = getPouch(this);
      const that = this;
      return db.putAttachment(this.id, name, this.get('_rev'), blob, type, (err, response) => {
        if (!err && response.rev) {
          const atts = that.get('_attachments') || {};
          atts[name] = {
            content_type: type,
            stub: true
          };
          that.set({ _id: response.id, _rev: response.rev, _attachments: atts }, { silent: true });
        }
        done(err, response);
      });
    }
  };
};

export default BackbonePouch;
