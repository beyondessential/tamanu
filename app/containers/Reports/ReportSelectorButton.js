import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const style = {
  color: 'black',
  display: 'inline-block',
  border: '1px solid green',
  padding: '1em',
  margin: '0.5em',
  width: '15em',
  textAlign: 'center',
  borderRadius: '0.4em',
};

export const ReportSelectorButton = ({ report }) => (
  <Link to={ '/reports/' + report.id } style={ style }>
    { report.name }
  </Link>
);
