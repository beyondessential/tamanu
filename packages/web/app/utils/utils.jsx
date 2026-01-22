import React, { isValidElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { each, isArray, toString } from 'lodash';
import { toast } from 'react-toastify';
import deepEqual from 'deep-equal';
import shortid from 'shortid';
import { singularize as singularizeFn } from 'inflection';
import { MAX_REPEATS } from '@tamanu/constants';

export const prepareToastMessage = msg => {
  const messages = isArray(msg) ? msg : [msg];
  return (
    <>
      {messages.map(text => (
        <div key={`err-msg-${text}`}>{isValidElement(text) ? text : toString(text)}</div>
      ))}
    </>
  );
};

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `web-${shortid.generate()}`;
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

export const notifyInfo = (msg, props) => notify(msg, { ...props, type: 'info' });
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

export const renderToText = element => {
  if (!isValidElement(element)) {
    throw new Error('`renderToText` has been called with an invalid element.');
  }

  const div = document.createElement('div');
  const root = createRoot(div);
  flushSync(() => {
    root.render(element); // Force DOM update before reading innerText
  });
  const renderedText = div.innerText;
  root.unmount();
  return renderedText;
};

export const preventInvalidNumber = event => {
  if (!event.target.validity.valid) {
    event.target.value = '';
  }
};

export const preventInvalidRepeatsInput = (event, { min = 0, max = MAX_REPEATS } = {}) => {
  const input = event?.target;
  if (!input) {
    return;
  }

  const { value } = input;
  const isValid =
    value === '' || (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= max);

  if (isValid) {
    input.dataset.previousValue = value;
  } else {
    input.value = input.dataset.previousValue || '';
  }
};

export const validateDecimalPlaces = (e, expectedDecimalPlaces = 2) => {
  const value = e.target.value;
  if (/^[−-]/.test(value)) {
    e.target.value = '';
    return;
  }
  if (value.includes('.')) {
    const decimalPlaces = value.split('.')[1].length;
    if (decimalPlaces > expectedDecimalPlaces) {
      e.target.value = parseFloat(value).toFixed(expectedDecimalPlaces);
    }
  }
};

export const singularize = (word, count) => {
  return Number(count) === 1 ? singularizeFn(word) : word;
};
