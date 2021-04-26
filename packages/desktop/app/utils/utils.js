import React, { Fragment } from 'react';
import { isArray, toString, each } from 'lodash';
import { toast } from 'react-toastify';
import deepEqual from 'deep-equal';
import shortid from 'shortid';

export const concatSelf = (array, ...items) => {
  items.map(item => {
    if (isArray(item)) {
      item.forEach(variable => array.push(variable));
    } else {
      array.push(item);
    }
  });
};

export const prepareToastMessage = msg => {
  const messages = isArray(msg) ? msg : [msg];
  return (
    <Fragment>
      {messages.map((text, key) => (
        <div key={`err-msg-${key}`}>{toString(text)}</div>
      ))}
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

export const getModifiedFieldNames = (objectA, objectB) => {
  const modifiedFields = [];
  Object.keys(objectA).forEach(key => {
    const valueA = objectA[key];
    const valueB = objectB[key];
    if (!deepEqual(valueA, valueB)) modifiedFields.push(key);
  });
  return modifiedFields;
};

export const history = {
  goBack: () => {
    window.history.back();
  },
};

export const hexToRgba = (hex, opacity) => {
  const hx = hex.replace('#', '');
  const r = parseInt(hx.substring(0, 2), 16);
  const g = parseInt(hx.substring(2, 4), 16);
  const b = parseInt(hx.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

export function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  return hash;
}
