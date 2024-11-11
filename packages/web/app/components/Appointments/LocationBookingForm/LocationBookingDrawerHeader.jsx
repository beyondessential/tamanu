import React from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../Translation';
import { BodyText, Heading4 } from '../../Typography';
import { Colors } from '../../../constants';

const Heading = styled(Heading4)`
  font-size: 16px;
  margin-bottom: 9px;
`;

const Description = styled(BodyText)`
  font-size: 11px;
  color: ${Colors.midText};
`;

const HeadingText = ({ isEdit }) =>
  isEdit ? (
    <TranslatedText stringId="locationBooking.form.edit.heading" fallback="Modify booking" />
  ) : (
    <TranslatedText stringId="locationBooking.form.new.heading" fallback="Book location" />
  );

const DescriptionText = ({ isEdit }) =>
  isEdit ? (
    <TranslatedText
      stringId="locationBooking.form.edit.description"
      fallback="Modify the selected booking below."
    />
  ) : (
    <TranslatedText
      stringId="locationBooking.form.new.description"
      fallback="Create a new booking by completing the below details and selecting ‘Confirm’"
    />
  );

export const LocationBookingDrawerHeader = ({ isEdit }) => (
  <header>
    <Heading>
      <HeadingText isEdit={isEdit} />
    </Heading>
    <Description>
      <DescriptionText isEdit={isEdit} />
    </Description>
  </header>
);
