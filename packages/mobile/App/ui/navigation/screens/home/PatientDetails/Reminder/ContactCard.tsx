import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/ui/components/Button';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { RowView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { RemoveContactModal } from './RemoveContactModal';

export const StyledViewWithBorder = styled(StyledView)`
  border: 1px solid ${theme.colors.BOX_OUTLINE};
  padding: 6px 18px;
  margin-top: 10px;
  border-radius: 5px;
  color: ${theme.colors.MAIN_SUPER_DARK};
`;

export const ContactInfo = ({ contactName, relationShip, contactMethod }) => (
  <StyledViewWithBorder>
    <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={600}
      >
        Contact
      </StyledText>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
      >
        {contactName}
      </StyledText>
    </RowView>
    <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={600}
      >
        RelationShip
      </StyledText>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
      >
        {relationShip}
      </StyledText>
    </RowView>
    <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={600}
      >
        Contact Method
      </StyledText>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
      >
        {contactMethod}
      </StyledText>
    </RowView>
  </StyledViewWithBorder>
);
export const ContactCard = ({ contactName, relationShip, contactMethod, contactId, patientId }) => {
  const [open, setOpen] = useState(false);
  return (
    <StyledView marginTop={10} marginBottom={10}>
      <ContactInfo {...{ contactName, relationShip, contactMethod }} />
      <Button
        onPress={() => setOpen(true)}
        width={100}
        alignSelf="flex-end"
        backgroundColor={theme.colors.WHITE}
      >
        <StyledText
          color={theme.colors.PRIMARY_MAIN}
          textDecorationLine={'underline'}
          fontWeight={600}
        >
          Remove
        </StyledText>
      </Button>
      <RemoveContactModal
        open={open}
        onClose={() => setOpen(false)}
        {...{ contactName, relationShip, contactMethod }}
      >
        <ContactInfo {...{ contactName, relationShip, contactMethod }} />
      </RemoveContactModal>
    </StyledView>
  );
};
