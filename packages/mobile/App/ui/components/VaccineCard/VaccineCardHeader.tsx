import React from 'react';
import { theme } from '/styled/theme';
import * as Icons from '../Icons';
import { RowView, StyledText, StyledTouchableOpacity, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { VaccineStatus } from '~/ui/helpers/patient';
import { TranslatedReferenceData } from '../Translations/TranslatedReferenceData';
import { VaccineDataProps } from '.';

export interface CardHeaderProps {
  vaccineData: VaccineDataProps;
  onCloseModal: () => void;
  onEditDetails: () => void;
}

export const VaccineCardHeader = ({
  vaccineData: { name, id: drugId, status, scheduledVaccineId, scheduledVaccineLabel },
  onCloseModal,
  onEditDetails,
}: CardHeaderProps): JSX.Element => {
  const isVaccineEditable = [VaccineStatus.NOT_GIVEN, VaccineStatus.GIVEN].includes(
    status as VaccineStatus,
  );

  return (
    <StyledView
      background={theme.colors.PRIMARY_MAIN}
      height={screenPercentageToDP('15.79', Orientation.Height)}
    >
      <RowView justifyContent="space-between" alignItems="center">
        <StyledTouchableOpacity
          paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
          paddingLeft={screenPercentageToDP(2.43, Orientation.Height)}
          paddingRight={screenPercentageToDP(2.43, Orientation.Height)}
          paddingBottom={screenPercentageToDP(2.43, Orientation.Height)}
          onPress={onCloseModal}
        >
          <Icons.CrossIcon size={screenPercentageToDP(2.18, Orientation.Height)} />
        </StyledTouchableOpacity>
        {isVaccineEditable && (
          <StyledTouchableOpacity
            onPress={onEditDetails}
            paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
            paddingLeft={screenPercentageToDP(2.43, Orientation.Height)}
            paddingRight={screenPercentageToDP(2.43, Orientation.Height)}
            paddingBottom={screenPercentageToDP(2.43, Orientation.Height)}
          >
            <StyledText
              textDecorationLine="underline"
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP('1.59', Orientation.Height)}
            >
              Edit Details
            </StyledText>
          </StyledTouchableOpacity>
        )}
      </RowView>
      <RowView
        paddingLeft={screenPercentageToDP(2.43, Orientation.Height)}
        paddingRight={screenPercentageToDP(2.43, Orientation.Height)}
        justifyContent="space-between"
        alignItems="center"
      >
        <StyledView>
          <StyledText
            fontWeight="bold"
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          >
            <TranslatedReferenceData
              value={scheduledVaccineId}
              fallback={scheduledVaccineLabel}
              category="scheduledVaccine"
            />
          </StyledText>
          <StyledText
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(1.944, Orientation.Height)}
          >
            <TranslatedReferenceData category="drug" value={drugId} fallback={name} />
          </StyledText>
        </StyledView>
      </RowView>
    </StyledView>
  );
};
