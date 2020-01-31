import React from 'react';
import { StyledView, CenterView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { VaccineIcons, VaccineStatus } from '../../helpers/constants';
import { NullValueCell } from '../Icons';

const VaccineIcon = ({ vaccineType }: VaccineTableCellProps): JSX.Element => {
  let Icon;
  if (vaccineType) {
    Icon = VaccineIcons[vaccineType];
  } else {
    Icon = NullValueCell;
  }
  switch (vaccineType) {
    case VaccineStatus.TAKEN:
      return <Icon height="100%" width={34} />;
    case VaccineStatus.NOT_TAKEN:
      return (
        <CenterView>
          <Icon height={85} width={34} />
        </CenterView>
      );
    case VaccineStatus.TAKEN_NOT_ON_TIME:
      return (
        <CenterView>
          <Icon height={84} width={34} />
        </CenterView>
      );
    default:
      return <Icon />;
  }
};

interface VaccineTableCellProps {
  vaccineType: string;
}

export const VaccineTableCell = ({
  vaccineType,
}: VaccineTableCellProps): JSX.Element => (
  <StyledView
    width={85}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    height={80}
    alignItems="center"
  >
    <VaccineIcon vaccineType={vaccineType} />
  </StyledView>
);
