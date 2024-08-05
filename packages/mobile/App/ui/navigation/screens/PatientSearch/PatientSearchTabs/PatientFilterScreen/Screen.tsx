import React, { ReactElement } from 'react';
import { Button } from '/components/Button';
import {
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledScrollView,
  StyledText,
} from '/styled/common';
import { theme } from '/styled/theme';
import {
  DateSection,
  NameSection,
  SexSection,
  VillageSection,
  ProgramRegistrySection,
} from './CustomComponents';
import SubmitSection from './CustomComponents/SubmitSection';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

interface ScreenProps {
  onCancel: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

export const Screen = ({ onSubmit, onClear, onCancel }: ScreenProps): ReactElement => (
  <FullView background={theme.colors.WHITE}>
    <StyledSafeAreaView>
      <RowView
        background={theme.colors.PRIMARY_MAIN}
        height={70}
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          onPress={onCancel}
          backgroundColor="transparent"
          width={screenPercentageToDP(10, Orientation.Width)}
          marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
        >
          <ArrowLeftIcon
            width={screenPercentageToDP(4.86, Orientation.Width)}
            height={screenPercentageToDP(4.86, Orientation.Width)}
          />
        </Button>

        <StyledText
          fontSize={screenPercentageToDP(2.28, Orientation.Height)}
          color={theme.colors.WHITE}
          textAlign="center"
        >
          <TranslatedText stringId="patient.search.filter.title" fallback="Filter Search" />
        </StyledText>

        <Button
          onPress={onClear}
          backgroundColor="transparent"
          width={screenPercentageToDP(20, Orientation.Width)}
          marginRight={screenPercentageToDP(2.43, Orientation.Width)}
        >
          <StyledText
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(1.57, Orientation.Height)}
          >
            <TranslatedText
              stringId="patient.search.filter.action.clearFilters"
              fallback="Clear filters"
            />
          </StyledText>
        </Button>
      </RowView>
    </StyledSafeAreaView>
    <StyledScrollView keyboardShouldPersistTaps="never">
      <NameSection />
      <DateSection />
      <VillageSection />
      <SexSection />
      <ProgramRegistrySection />
      <SubmitSection onSubmit={onSubmit} />
    </StyledScrollView>
  </FullView>
);
