import React, { ReactElement, useCallback, FC } from 'react';
import {
  StyledView,
  CenterView,
  StyledTouchableOpacity,
  StyledImage,
} from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineIcons, VaccineStatus } from '/helpers/constants';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IScheduledVaccine } from '~/types';

const VaccineIcon = ({
  status = null,
}: {
  status: string | null;
}): JSX.Element => {
  let Icon: FC<any> | null = null;
  if (status) {
    Icon = VaccineIcons[status].Icon;
    switch (status) {
      case VaccineStatus.SCHEDULED:
        return (
          <CenterView flex={1}>
            <Icon background="transparent" />
          </CenterView>
        );
      case VaccineStatus.TAKEN:
        return (
          <CenterView flex={1}>
            <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
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
        return (
          <CenterView flex={1}>
            <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
          </CenterView>
        );
    }
  }
  return <StyledImage source={require('../../assets/NullValueCell.png')} />;
};

interface VaccineTableCellProps {
  vaccine: IScheduledVaccine;
  status: any;
  onPress?: (item: any) => void;
}

const CellContent = ({ status }: { status: string | null }): ReactElement => (
  <StyledView
    width={85}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    height={80}
    alignItems="center"
  >
    <VaccineIcon status={status} />
  </StyledView>
);

export const VaccineTableCell = ({
  vaccine,
  onPress,
}: VaccineTableCellProps): JSX.Element => {
  const onPressItem = useCallback(() => {
    if (onPress) onPress(vaccine);
  }, []);

  return vaccine.status ? (
    <StyledTouchableOpacity onPress={onPressItem}>
      <CellContent status={vaccine.status} />
    </StyledTouchableOpacity>
  ) : (
    <CellContent status={null} />
  );
};

VaccineTableCell.defaultProps = {
  onPress: (): null => null,
};
