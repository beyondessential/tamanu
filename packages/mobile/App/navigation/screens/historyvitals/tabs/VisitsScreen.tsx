import React, { ReactElement, useCallback } from 'react';
import {
  FullView,
  StyledSafeAreaView,
  StyledView,
  RotateView,
} from '/styled/common';
import { AccordionList } from '/components/Accordion';
import { data } from '/components/Accordion/fixtures';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import { OptionsGlyph } from '/components/Icons';

export const VisitsScreen = (): ReactElement => {
  const activeFilters = {
    count: 0,
  };

  const navigateToHistoryFilters = useCallback(() => {
    console.log('going to filters..');
  }, []);
  return (
    <StyledSafeAreaView flex={1}>
      <FullView background={theme.colors.BACKGROUND_GREY}>
        <AccordionList dataArray={data} />
        <StyledView
          position="absolute"
          zIndex={2}
          width="100%"
          alignItems="center"
          bottom={30}
        >
          <Button
            width={250}
            backgroundColor={`${theme.colors.MAIN_SUPER_DARK}`}
            bordered
            textColor={theme.colors.WHITE}
            onPress={navigateToHistoryFilters}
            buttonText={`Filters ${
              activeFilters.count > 0 ? `${activeFilters.count}` : ''
            }`}
          >
            <RotateView>
              <OptionsGlyph
                fill={
                  activeFilters.count > 0
                    ? theme.colors.SECONDARY_MAIN
                    : theme.colors.WHITE
                }
                height={20}
              />
            </RotateView>
          </Button>
        </StyledView>
      </FullView>
    </StyledSafeAreaView>
  );
};
