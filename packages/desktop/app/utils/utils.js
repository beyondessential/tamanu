import React from 'react';
import { isArray, toString, each } from 'lodash';
import { toast } from 'react-toastify';
import deepEqual from 'deep-equal';
import shortid from 'shortid';

export const concatSelf = (array, ...items) => {
  items.forEach(item => {
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
    <>
      {messages.map(text => (
        <div key={`err-msg-${text}`}>{toString(text)}</div>
      ))}
    </>
  );
};

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `desktop-${shortid.generate()}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export const notify = (message, props) => {
  if (message !== false) {
    toast(prepareToastMessage(message), props);
  } else {
    toast.dismiss();
  }
};

export const notifySuccess = (msg, props) => notify(msg, { ...props, type: 'success' });
export const notifyError = (msg, props) => notify(msg, { ...props, type: 'error' });

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
