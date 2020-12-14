import React, { ReactElement, useCallback, FC } from 'react';
import { Popup } from 'popup-ui';
import {
  StyledView,
  CenterView,
  StyledTouchableOpacity,
  StyledImage,
} from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineIcons, VaccineStatus } from '/helpers/constants';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IAdministeredVaccine } from '~/types';

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
      case VaccineStatus.GIVEN:
        return (
          <CenterView flex={1}>
            <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
          </CenterView>
        );
      case VaccineStatus.NOT_GIVEN:
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
  vaccine: IAdministeredVaccine;
  status: any;
  onPress?: (item: any) => void;
}

const CellContent = ({
  weeksUntilDue, status,
}: { weeksUntilDue: number | null; status: string | null }): ReactElement => {
  const Cell = ({ background }): ReactElement => (
    <StyledView
      width={85}
      borderRightWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      background={background}
      borderBottomWidth={1}
      height={80}
      alignItems="center"
    >
      <VaccineIcon status={status} />
    </StyledView>
  );

  if (weeksUntilDue < -4) { // missed, move to catchup
    return <Cell background={theme.colors.DISABLED_GREY} />;
  }
  if (weeksUntilDue < 0) { // overdue
    return <Cell background={theme.colors.ALERT} />;
  }
  if (weeksUntilDue <= 1) { // due
    return <Cell background={theme.colors.BRIGHT_BLUE} />;
  }
  if (weeksUntilDue > 2) { // upcoming
    return <Cell background={theme.colors.LIGHT_BLUE} />;
  }
  if (weeksUntilDue > 12) { // scheduled
    return <Cell background={theme.colors.PRIMARY_MAIN} />;
  }

  return (
    <Cell background={theme.colors.BACKGROUND_GREY} />
  );
};

export const VaccineTableCell = ({
  vaccine,
  onPress,
}: VaccineTableCellProps): JSX.Element => {
  const { weeksUntilDue, status } = vaccine;
  const shouldAdministerVaccine = weeksUntilDue <= 1 && weeksUntilDue > -4;
  const isVaccineEditable = status !== VaccineStatus.SCHEDULED;

  const onPressItem = useCallback(() => {
    if (weeksUntilDue > 4 && status === VaccineStatus.SCHEDULED) {
      Popup.show({
        type: 'Warning',
        title: 'Vaccine not due',
        button: true,
        textBody: `This patient should receive this vaccine in ${weeksUntilDue} weeks.`,
        buttonText: 'Ok',
        callback: () => Popup.hide(),
      });
    }
    if (weeksUntilDue < -4 && status === VaccineStatus.SCHEDULED) {
      Popup.show({
        type: 'Warning',
        title: 'Vaccine overdue',
        button: true,
        textBody:
          `Patient has missed this vaccine by ${Math.abs(weeksUntilDue)} weeks, please refer to the catchup schedule.`,
        buttonText: 'Ok',
        callback: () => Popup.hide(),
      });
    }

    if (shouldAdministerVaccine || isVaccineEditable) onPress(vaccine);
  }, [vaccine]);

  return (vaccine.status) ? (
    <StyledTouchableOpacity onPress={onPressItem}>
      <CellContent status={status} weeksUntilDue={weeksUntilDue} />
    </StyledTouchableOpacity>
  ) : (
    <CellContent status={null} weeksUntilDue={weeksUntilDue} />
  );
};

VaccineTableCell.defaultProps = {
  onPress: (): null => null,
};
