import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

const overrides = {}; // add keys to this object to help with development

export const connectFlags = connect(state => ({
  getFlag: path => get({ ...state.featureFlags, ...overrides }, path),
}));
