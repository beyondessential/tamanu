// Copied from Tupaia

import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { TextButton as BaseTextButton } from '../../../../../components';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

const TextButton = styled(BaseTextButton)`
  font-weight: 500;
  line-height: 18px;
  font-size: 14px;
  text-underline-offset: 3px;
  text-decoration: underline;
  :hover {
    text-decoration: underline;
  }
`;

export const ParameterList = ({ children, onAdd }) => {
  return (
    <div>
      <div>{children}</div>
      <TextButton color="primary" onClick={onAdd} data-testid='textbutton-xf4m'>
        + {<TranslatedText
        stringId="general.action.add"
        fallback="Add"
        data-testid='translatedtext-vzs8' />}
      </TextButton>
    </div>
  );
};

ParameterList.propTypes = {
  children: PropTypes.node.isRequired,
  onAdd: PropTypes.func.isRequired,
};
