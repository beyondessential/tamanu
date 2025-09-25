import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Colors, TAMANU_COLORS } from '../app/constants/styles';
import {
  InwardArrowVectorTooltipContent,
  TooltipContent,
} from '../app/components/Charts/components/TooltipContent';

const FlexColumn = styled.div`
  flex-direction: column;
  display: flex;
`;

const Wrapper = styled(FlexColumn)`
  gap: 20px;
`;

const TooltipWrapper = styled.div`
  backgroundcolor: ${TAMANU_COLORS.white};
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  width: 250px;
`;

storiesOf('Vitals', module).add('Vital Tooltip', () => {
  const name = '2023-05-30 10:04:52';
  return (
    <Wrapper>
      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="36.4"
          dotColor={TAMANU_COLORS.blue}
          visualisationConfig={{ config: { unit: '°C' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="39.1"
          dotColor={TAMANU_COLORS.alert}
          description="(Outside normal range >39°C)"
          visualisationConfig={{ config: { unit: '°C' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="42.2"
          dotColor={TAMANU_COLORS.darkestText}
          description="(Outside normal range >39°C) (Outside graph range)"
          visualisationConfig={{ config: { unit: '°C' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <InwardArrowVectorTooltipContent
          name={name}
          value="36"
          dotColor={TAMANU_COLORS.darkestText}
          inwardArrowVector={{ top: 36, bottom: 30 }}
          visualisationConfig={{ config: { unit: 'mm Hg' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <InwardArrowVectorTooltipContent
          name={name}
          value="42.2"
          dotColor={TAMANU_COLORS.alert}
          inwardArrowVector={{ top: 42.2, bottom: 30 }}
          description="(Outside normal range >39) (Outside graph range)"
          visualisationConfig={{ config: { unit: 'mm Hg' } }}
        />
      </TooltipWrapper>
    </Wrapper>
  );
});
