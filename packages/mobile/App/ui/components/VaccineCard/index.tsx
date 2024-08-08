import React, { FC, FunctionComponent, PropsWithChildren, useMemo } from 'react';
import { StyledView } from '/styled/common';
import { VaccineCardHeader } from './VaccineCardHeader';
import { IAdministeredVaccine } from '~/types';
import { NotGivenFields } from './NotGivenFields';
import GivenOnTimeFields from './GivenOnTimeFields';
import { VaccineStatusHeader } from './VaccineStatusHeader';
import { VaccineStatus } from '~/ui/helpers/patient';

export type VaccineDataProps = {
  id: string, // Drug id
  administeredVaccine: IAdministeredVaccine;
  status: VaccineStatus;
  scheduledVaccineId: string, // Vaccine id
  scheduledVaccineLabel: string,
  doseLabel: string;
  name: string;
  code: string;
};

interface VaccineCardProps {
  vaccineData: VaccineDataProps;
  onCloseModal: () => void;
  onEditDetails: () => void;
}

export const VaccineCard: FunctionComponent<PropsWithChildren<VaccineCardProps>> = ({
  vaccineData,
  onCloseModal,
  onEditDetails,
}: VaccineCardProps) => {
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
    <StyledView>
      <VaccineCardHeader
        vaccineData={vaccineData}
        onCloseModal={onCloseModal}
        onEditDetails={onEditDetails}
      />
      <VaccineStatusHeader status={vaccineData.status} />
      <Fields {...vaccineData} />
    </StyledView>
  );
};
