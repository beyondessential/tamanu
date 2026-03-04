import React, { isValidElement } from 'react';
import { isArray, toString } from 'lodash';
import { toast } from 'react-toastify';

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
