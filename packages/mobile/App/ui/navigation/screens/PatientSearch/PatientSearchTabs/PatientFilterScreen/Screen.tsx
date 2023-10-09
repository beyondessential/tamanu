import React, { ReactElement } from 'react';
import { Button } from '/components/Button';
import {
  StyledText,
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledView,
  StyledScrollView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { SexSection, DateSection, NameSection, VillageSection } from './CustomComponents';
import SubmitSection from './CustomComponents/SubmitSection';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { PatientAdditionalDataFields } from '~/ui/components/Forms/PatientAdditionalDataForm/PatientAdditionalDataFields';
import { allAdditionalDataFields } from '~/ui/helpers/additionalData';

interface ScreenProps {
  onCancel: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

export const Screen = ({ onSubmit, onClear, onCancel }: ScreenProps): ReactElement => (
  <FullView>
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView
        background={theme.colors.PRIMARY_MAIN}
        height={70}
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          flex={1}
          justifyContent="flex-start"
          onPress={onCancel}
          backgroundColor="transparent"
        >
          <StyledText
            marginLeft={screenPercentageToDP(4.86, Orientation.Width)}
            color={theme.colors.BOX_OUTLINE}
            fontSize={12}
          >
            Cancel
          </StyledText>
        </Button>
        <StyledView position="absolute" width="100%" alignItems="center" zIndex={-1}>
          <StyledText fontSize={18} color={theme.colors.WHITE}>
            Filter Search
          </StyledText>
        </StyledView>
        <Button flex={1} onPress={onClear} justifyContent="flex-end" backgroundColor="transparent">
          <StyledText
            marginRight={screenPercentageToDP(4.86, Orientation.Width)}
            fontSize={12}
            color={theme.colors.BOX_OUTLINE}
          >
            Clear Filters
          </StyledText>
        </Button>
      </RowView>
    </StyledSafeAreaView>
    <StyledScrollView keyboardShouldPersistTaps="never">
      <FullView background={theme.colors.BACKGROUND_GREY}>
        <SexSection />
        <DateSection />
        <NameSection />
        <VillageSection />
        <SubmitSection onSubmit={onSubmit} />
      </FullView>
    </StyledScrollView>
  </FullView>
);
