import React from 'react';
import { LocalisedField } from '../../Field/LocalisedField';
import { QRCodeSearchField } from '../../Field/QRCodeSearchField';
import { QRCodeTextField } from '../../Field/QRCodeTextField';

export const CulturalNameSearchField = props => (
  <LocalisedField {...props} component={QRCodeSearchField} matchDisplayIdPattern={false} />
);

export const CulturalNameTextField = props => (
  <LocalisedField {...props} component={QRCodeTextField} matchDisplayIdPattern={false} />
);
