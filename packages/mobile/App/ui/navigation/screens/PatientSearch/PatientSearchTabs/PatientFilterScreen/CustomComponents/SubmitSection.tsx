import { Button } from '/components/Button';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { ReactElement } from 'react';

const SubmitSection = ({
  onSubmit,
}: {
  onSubmit: () => void;
}): ReactElement => (
  <CenterView
    background={theme.colors.WHITE}
    height={90}
    marginBottom={screenPercentageToDP(4.86, Orientation.Height)}
  >
    <Button height={50} width={370} buttonText="Search" onPress={onSubmit} />
  </CenterView>
);

export default SubmitSection;
