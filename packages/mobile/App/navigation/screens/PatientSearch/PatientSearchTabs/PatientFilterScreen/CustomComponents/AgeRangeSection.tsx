import React, { ReactElement } from 'react';
import { useField } from 'formik';
//Components
import { Section } from './Section';
import { CenterView, StyledText } from '../../../../../../styled/common';
import { Field } from '../../../../../../components/Forms/FormField';
import { AgeRangeSlider } from '../../../../../../components/RangeSlider';
// Helpers
import { screenPercentageToDP, Orientation } from '../../../../../../helpers/screen';
import { theme } from '../../../../../../styled/theme';


export const AgeRangeSection = (): ReactElement => {
  const [field] = useField('age');
  return (
    <Section
      title="Age range"
    >
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
