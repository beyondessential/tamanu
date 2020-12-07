import React, {
  PropsWithChildren,
  FunctionComponent,
  useMemo,
  FC,
} from 'react';
import { StyledView } from '/styled/common';
import { VaccineCardHeader } from './VaccineCardHeader';
import { IAdministeredVaccine } from '~/types';
import { VaccineStatus } from '/helpers/constants';
import { NotGivenFields } from './NotGivenFields';
import GivenOnTimeFields from './GivenOnTimeFields';
import { VaccineStatusHeader } from './VaccineStatusHeader';

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
      case VaccineStatus.NOT_GIVEN:
        return NotGivenFields;
      case VaccineStatus.GIVEN:
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
      <VaccineStatusHeader status={vaccineData} />
      <Fields {...vaccineData} />
    </StyledView>
  );
};
