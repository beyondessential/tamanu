import React from 'react';
import styled from 'styled-components';
import { Colors } from '../app/constants/styles';
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
  backgroundcolor: ${Colors.white};
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  width: 250px;
`;

export default {
  title: 'Vitals',
};

export const VitalTooltip = () => {
  const name = '2023-05-30 10:04:52';
  return (
    <Wrapper>
      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="36.4"
          dotColor={Colors.blue}
          visualisationConfig={{ config: { unit: '°C' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="39.1"
          dotColor={Colors.alert}
          description="(Outside normal range >39°C)"
          visualisationConfig={{ config: { unit: '°C' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="42.2"
          dotColor={Colors.darkestText}
          description="(Outside normal range >39°C) (Outside graph range)"
          visualisationConfig={{ config: { unit: '°C' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <InwardArrowVectorTooltipContent
          name={name}
          value="36"
          dotColor={Colors.darkestText}
          inwardArrowVector={{ top: 36, bottom: 30 }}
          visualisationConfig={{ config: { unit: 'mm Hg' } }}
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <InwardArrowVectorTooltipContent
          name={name}
          value="42.2"
          dotColor={Colors.alert}
          inwardArrowVector={{ top: 42.2, bottom: 30 }}
          description="(Outside normal range >39) (Outside graph range)"
          visualisationConfig={{ config: { unit: 'mm Hg' } }}
        />
      </TooltipWrapper>
    </Wrapper>
  );
};
