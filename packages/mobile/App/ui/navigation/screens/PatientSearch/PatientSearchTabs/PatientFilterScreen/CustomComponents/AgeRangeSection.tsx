import React, { ReactElement } from 'react';
import { useField } from 'formik';

//Components
import { Section } from './Section';
import { CenterView, StyledText } from '~/ui/styled/common';
import { Field } from '~/ui/components/Forms/FormField';
import { AgeRangeSlider } from '~/ui/components/RangeSlider';
// Helpers
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';

export const AgeRangeSection = (): ReactElement => {
  const [field] = useField('age');
  return (
    <Section localisedField="ageRange">
      <CenterView>
        <StyledText
          fontSize={screenPercentageToDP(1.94, Orientation.Height)}
          color={theme.colors.TEXT_MID}
        >
          {field.value[0]} yrs to {field.value[1]} yrs
        </StyledText>
        <Field
          component={AgeRangeSlider}
          name="age"
          min={0}
          max={110}
          rangeStart={field.value[0]}
          rangeEnd={field.value[1]}
          width={screenPercentageToDP('90.02', Orientation.Width)}
        />
      </CenterView>
    </Section>
  );
};
