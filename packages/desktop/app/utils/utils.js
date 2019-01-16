import React, { Fragment } from 'react';
import { isArray, toString } from 'lodash';
import { toast } from 'react-toastify';
import shortid from 'shortid';
import createHistory from 'history/createHashHistory';

export const history = createHistory();

export const concatSelf = (array, ...items) => {
  items.map(item => {
    if (isArray(item)) {
      item.forEach(variable => array.push(variable));
    } else {
      array.push(item)
    }
  });
}

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

export const notify = (message, { type='error', autoClose=3000, ...props } = {}) =>
  toast(prepareToastMessage(message), { type, autoClose, ...props });

