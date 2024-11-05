import React from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../Translation';
import { BodyText, Heading4 } from '../../Typography';
import { Colors } from '../../../constants';
import { ClearIcon } from '../../Icons';

const Heading = styled(Heading4)`
  font-size: 16px;
  position: sticky;
  z-index: 1;
  background-color: ${Colors.background};
  border-bottom: 1px ${Colors.outline} solid;
  padding-bottom: 5px;
  margin-top: 0;
  margin-left: -1rem;
  margin-right: -1rem;
  margin-bottom: 9px;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 1rem;
  top: 0;
`;

const Description = styled(BodyText)`
  font-size: 12px;
  color: ${Colors.midText};
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
`;

const HeadingText = ({ editMode }) =>
  editMode ? (
    <TranslatedText stringId="locationBooking.form.edit.heading" fallback="Modify booking" />
  ) : (
    <TranslatedText stringId="locationBooking.form.new.heading" fallback="Book location" />
  );

const DescriptionText = ({ editMode }) =>
  editMode ? (
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

export const BookLocationHeader = ({ editMode, onClose }) => (
  <>
    <Heading>
      <HeadingText editMode={editMode} />
      <CloseDrawerIcon onClick={onClose} />
    </Heading>
    <Description>
      <DescriptionText editMode={editMode} />
    </Description>
  </>
);
