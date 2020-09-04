import React, { ReactElement, useCallback } from 'react';
import { FullView, StyledSafeAreaView, StyledView } from '/styled/common';
import { AccordionList } from '/components/Accordion';
import { data } from '/components/Accordion/fixtures';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import { FilterIcon } from '/components/Icons';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';

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
            width={screenPercentageToDP(60.82, Orientation.Width)}
            backgroundColor={`${theme.colors.MAIN_SUPER_DARK}`}
            bordered
            textColor={theme.colors.WHITE}
            onPress={navigateToHistoryFilters}
            buttonText={`Filters ${
              activeFilters.count > 0 ? `${activeFilters.count}` : ''
            }`}
          >
            <StyledView
              marginRight={screenPercentageToDP(1.21, Orientation.Height)}
            >
              <FilterIcon
                fill={
                  activeFilters.count > 0
                    ? theme.colors.SECONDARY_MAIN
                    : theme.colors.WHITE
                }
                height={screenPercentageToDP(2.43, Orientation.Height)}
              />
            </StyledView>
          </Button>
        </StyledView>
      </FullView>
    </StyledSafeAreaView>
  );
};
