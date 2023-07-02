import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Colors } from '../app/constants';
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

storiesOf('Vitals', module).add('Vital Tooltip', () => {
  const name = '2023-05-30 10:04:52';
  return (
    <Wrapper>
      <TooltipWrapper>
        <TooltipContent name={name} value="36.4°C" dotColor={Colors.blue} />
      </TooltipWrapper>

      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="39.1°C"
          dotColor={Colors.alert}
          description="(Outside normal range >39°C)"
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <TooltipContent
          name={name}
          value="42.2°C"
          dotColor={Colors.darkestText}
          description="(Outside normal range >39°C) (Outside graph range)"
        />
      </TooltipWrapper>

      <TooltipWrapper>
        <InwardArrowVectorTooltipContent name={name} value="36°C" dotColor={Colors.darkestText} />
      </TooltipWrapper>

      <TooltipWrapper>
        <InwardArrowVectorTooltipContent
          name={name}
          value="42.2°C"
          dotColor={Colors.alert}
          description="(Outside normal range >39°C) (Outside graph range)"
        />
      </TooltipWrapper>
    </Wrapper>
  );
});
