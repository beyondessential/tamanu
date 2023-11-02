import React, { ReactElement } from 'react';
import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

const SubmitSection = ({ onSubmit }: { onSubmit: () => void }): ReactElement => (
  <CenterView
    background={theme.colors.WHITE}
    height={90}
    marginBottom={screenPercentageToDP(4.86, Orientation.Height)}
  >
    <Button
      backgroundColor={theme.colors.PRIMARY_MAIN}
      height={50}
      width={370}
      fontSize={16}
      fontWeight={500}
      buttonText="Search"
      onPress={onSubmit}
    />
  </CenterView>
);

export default SubmitSection;
