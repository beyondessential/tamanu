import React from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../Translation';
import { BodyText, Heading4 } from '../../Typography';
import { Colors } from '../../../constants';
import { Close } from '@material-ui/icons';
import { ClearIcon } from '../../Icons';

const HeaderContainer = styled.header`
  position: sticky;
  z-index: 1; 
  background-color: ${Colors.background};
  border-bottom: 1px ${Colors.outline} solid;
  padding-bottom: 5px;
  top: 0;
`;

const Heading = styled(Heading4)`
  font-size: 16px;
  margin: 0;
  margin-bottom: 9px;
`;

const Description = styled(BodyText)`
  font-size: 12px;
  color: ${Colors.midText};
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  inset-block-start: 0rem;
  inset-inline-end: 00rem;
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
  <HeaderContainer>
    <Heading>
      <HeadingText editMode={editMode} />
    </Heading>
    <Description>
      <DescriptionText editMode={editMode} />
    </Description>
    <CloseDrawerIcon onClick={onClose} />
  </HeaderContainer>
);
