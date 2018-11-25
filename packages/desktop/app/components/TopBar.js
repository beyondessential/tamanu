import React from 'react';
import PropTypes from 'prop-types';

export const TopBar = ({ children }) => (
  <div className="view-top-bar">
    <span>
      { children }
    </span>
  </div>
);

TopBar.propTypes = {
  children: PropTypes.node,
};
