import React from 'react';
import { StyledView, StyledText, RowView } from '/styled/common';
import { theme } from '/styled/theme';
import * as Icons from '../Icons';
import { PractitionerProps } from '../../interfaces/PractitionerProps';

export const PractitionerView = ({ name }: PractitionerProps): JSX.Element => (
  <StyledView>
    <StyledText
      color={theme.colors.TEXT_SUPER_DARK}
      fontWeight={500}
      fontSize={14}
    >
      Practitioner
    </StyledText>
    <RowView marginTop={10} alignItems="center">
      <StyledView marginRight={10}>
        <Icons.Avatar7 height={30} />
      </StyledView>
      <StyledText fontSize={16} color={theme.colors.TEXT_MID}>
        {name}
      </StyledText>
    </RowView>
  </StyledView>
);
