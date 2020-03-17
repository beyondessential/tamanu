import React, { ReactElement, useCallback } from 'react';
import {
  StyledView,
  CenterView,
  StyledTouchableOpacity,
} from '../../styled/common';
import { theme } from '../../styled/theme';
import { VaccineIcons, VaccineStatus } from '../../helpers/constants';
import { NullValueCell } from '../Icons';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { VaccineModel } from '../../models/Vaccine';

const VaccineIcon = ({
  vaccineType,
}: {
  vaccineType: string | null;
}): JSX.Element => {
  let Icon;
  if (vaccineType) {
    Icon = VaccineIcons[vaccineType].Icon;
  } else {
    Icon = NullValueCell;
  }
  switch (vaccineType) {
    case VaccineStatus.TAKEN:
      return (
        <CenterView flex={1}>
          <Icon
            size={screenPercentageToDP(4.13, Orientation.Height)}
            background="transparent"
          />
        </CenterView>
      );
    case VaccineStatus.NOT_TAKEN:
      return (
        <CenterView flex={1}>
          <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
        </CenterView>
      );
    case VaccineStatus.TAKEN_NOT_ON_TIME:
      return (
        <CenterView flex={1}>
          <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
        </CenterView>
      );
    default:
      return <Icon size={35} />;
  }
};

interface VaccineTableCellProps {
  header: any;
  vaccine: VaccineModel;
  onPress?: (item: any) => void;
}

const CellContent = ({ data }: { data: string | null }): ReactElement => (
  <StyledView
    width={85}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    height={80}
    alignItems="center"
  >
    <VaccineIcon vaccineType={data} />
  </StyledView>
);

export const VaccineTableCell = ({
  vaccine,
  onPress,
  header,
}: VaccineTableCellProps): JSX.Element => {
  const onPressItem = useCallback(() => {
    const vaccineData = { ...vaccine, dateType: header };
    if (onPress) onPress(vaccineData);
  }, []);
  return vaccine !== null ? (
    <StyledTouchableOpacity onPress={onPressItem}>
      <CellContent data={vaccine.status} />
    </StyledTouchableOpacity>
  ) : (
    <CellContent data={null} />
  );
};
