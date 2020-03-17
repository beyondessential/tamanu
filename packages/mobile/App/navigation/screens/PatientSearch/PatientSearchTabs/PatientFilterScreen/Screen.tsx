import React, { ReactElement } from 'react';
import { Button } from '../../../../../components/Button';
import {
  StyledText,
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledView,
  StyledScrollView,
} from '../../../../../styled/common';
import { theme } from '../../../../../styled/theme';
import { SexSection,
  AgeRangeSection,
  DateSection,
  NameSection,
  KeywordSection,
  SortBySection,
  OnlyShowOptions } from './CustomComponents';
import SubmitSection from './CustomComponents/SubmitSection';

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
          width={120}
          onPress={onCancel}
          backgroundColor="transparent"
          buttonText="Cancel"
          textColor={theme.colors.BOX_OUTLINE}
          fontSize={12}
        />
        <StyledView position="absolute" width="100%" alignItems="center" zIndex={-1}>
          <StyledText fontSize={18} color={theme.colors.WHITE}>Filter Search</StyledText>
        </StyledView>
        <Button
          flex={1}
          width={120}
          onPress={onClear}
          buttonText="Clear Filters"
          textColor={theme.colors.BOX_OUTLINE}
          fontSize={12}
          backgroundColor="transparent"
        />
      </RowView>
    </StyledSafeAreaView>
    <StyledScrollView
      keyboardShouldPersistTaps="never"
    >
      <FullView
        background={theme.colors.BACKGROUND_GREY}
      >
        <SexSection />
        <AgeRangeSection />
        <DateSection />
        <NameSection />
        <KeywordSection />
        <SortBySection />
        <OnlyShowOptions />
        <SubmitSection onSubmit={onSubmit} />
      </FullView>
    </StyledScrollView>
  </FullView>
);
