import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import tamanuLogo from '../assets/images/tamanu_logo.svg';

const logoStyle = {
  fontWeight: 300,
};

const imgStyle = {
  display: 'inline-block',
};

export const TamanuBrandMark = () => (
  <Link className="header" to="/" replace style={ logoStyle }>
    <span>
      Tamanu
    </span>
  </Link>
);

export const TamanuLogo = ({ width }) => (
  <Link to="/" replace style={ logoStyle }>
    <span>
      <img
        src={ tamanuLogo } 
        style={ { ...imgStyle, width } }
      />
    </span>
  </Link>
);
