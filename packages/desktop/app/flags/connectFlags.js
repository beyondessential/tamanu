import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

export const connectFlags = connect(state => ({
  getFlag: path => get(state.featureFlags, path),
}));
