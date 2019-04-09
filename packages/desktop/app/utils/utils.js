import React, { Fragment } from 'react';
import { isArray, toString, each } from 'lodash';
import { toast } from 'react-toastify';
import jsonPrune from 'json-prune';
import shortid from 'shortid';
import { createHashHistory } from 'history';

export const history = createHashHistory();

export const toTitleCase = text => (text
  ? text.split(' ')
    .map(t => t.slice(0, 1).toUpperCase() + t.slice(1))
    .join(' ')
  : '');

export const concatSelf = (array, ...items) => {
  items.map(item => {
    if (isArray(item)) {
      item.forEach(variable => array.push(variable));
    } else {
      array.push(item);
    }
  });
};

export const prepareToastMessage = (msg) => {
  const messages = isArray(msg) ? msg : [msg];
  return (
    <Fragment>
      {messages.map((text, key) => (<div key={`err-msg-${key}`}>{toString(text)}</div>))}
    </Fragment>
  );
};

export const initClient = () => {
  const clientId = localStorage.getItem('clientId');
  if (!clientId) {
    localStorage.setItem('clientId', shortid.generate());
  }
};

export const getClient = () => {
  initClient();
  return localStorage.getItem('clientId');
};

export const notify = (message, { type = 'error', autoClose = null, ...props } = {}) => {
  if (message !== false) {
    toast(prepareToastMessage(message), { type, autoClose, ...props });
  } else {
    toast.dismiss();
  }
};

export const notifySuccess = (msg, props) => notify(msg, { ...props, type: 'success' });
export const notifyError = notify;

export const flattenRequest = (object, deep = true) => {
  try {
    const newObject = object;
    if (isArray(object) && deep) return object.map(obj => flattenRequest(obj, false));
    each(newObject, (value, key) => {
      if (typeof value === 'object') {
        if (!deep) {
          delete newObject[key];
        } else {
          newObject[key] = flattenRequest(newObject[key], typeof value === 'object');
        }
      } else {
        newObject[key] = value;
      }
    });
    return newObject;
  } catch (err) {
    throw new Error(err);
  }
};

export const jsonDiff = (objectA, objectB) => {
  const modifiedFields = [];
  Object.keys(objectA).forEach(key => {
    const valueA = objectA[key];
    const valueB = objectB[key];
    // compare types
    if (typeof valueA === typeof valueB) {
      if (typeof valueA === 'object') { // stringify objects and compare
        if (JSON.stringify(valueA) !== JSON.stringify(valueB)) modifiedFields.push(key);
      } else if (valueA !== valueB) modifiedFields.push(key); // compare non-object values
    } else {
      modifiedFields.push(key);
    }
  });

  return modifiedFields;
};
