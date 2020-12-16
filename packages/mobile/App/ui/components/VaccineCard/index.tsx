import React, {
  PropsWithChildren,
  FunctionComponent,
  useMemo,
  FC,
} from 'react';
import { StyledView } from '/styled/common';
import { VaccineCardHeader } from './VaccineCardHeader';
import { IAdministeredVaccine } from '~/types';
import { NotGivenFields } from './NotGivenFields';
import GivenOnTimeFields from './GivenOnTimeFields';
import { VaccineStatusHeader } from './VaccineStatusHeader';
import { ScheduledVaccineStatus } from '~/ui/helpers/patient';

export type VaccineDataProps = IAdministeredVaccine;

interface VaccineCardProps {
  vaccineData: VaccineDataProps;
  onCloseModal: () => void;
  onEditDetails: () => void;
}

export const VaccineCard: FunctionComponent<PropsWithChildren<
  VaccineCardProps
>> = ({ vaccineData, onCloseModal, onEditDetails }: VaccineCardProps) => {
  const Fields: FC<VaccineDataProps> = useMemo(() => {
    switch (vaccineData.status) {
      case ScheduledVaccineStatus.NOT_GIVEN:
        return NotGivenFields;
      case ScheduledVaccineStatus.GIVEN:
        return GivenOnTimeFields;
      default:
        return GivenOnTimeFields;
    }
  }, [vaccineData.status]);
  return (
    <StyledView width="80.29%">
      <VaccineCardHeader
        vaccine={vaccineData}
        onCloseModal={onCloseModal}
        onEditDetails={onEditDetails}
      />
      <VaccineStatusHeader status={vaccineData.status} />
      <Fields {...vaccineData} />
    </StyledView>
  );
};
