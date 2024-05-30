import { SETTING_KEYS } from '~/constants';
import { useSettings } from '../contexts/SettingsContext';
import { VaccineStatus } from '../helpers/patient';

type UpcomingVaccinationThresholds = { threshold: number; status: VaccineStatus }[];

export const useVaccineStatus = ({
  scheduledVaccine,
  patient,
  patientAdministeredVaccines = [],
}: any) => {
  const { index, vaccine } = scheduledVaccine;
  const { getSetting } = useSettings();
  const thresholds = getSetting<UpcomingVaccinationThresholds>(SETTING_KEYS.UPCOMING_VACCINATION_THRESHOLDS);

  console.log(scheduledVaccine, 'SHED VAX');
  const previousAdministeredVaccine = patientAdministeredVaccines.find(
    ({ scheduledVaccine }: any) =>
      scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id,
  );
  console.log(previousAdministeredVaccine, 'PREV ADMIN');
};
