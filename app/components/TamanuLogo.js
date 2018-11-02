import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';

const logoStyle = {
  fontWeight: 300
};

export const TamanuLogo = () => (
  <Link className="header" to="/" replace>
    <span style={ logoStyle }>
      Tamanu
    </span>
  </Link>
);
