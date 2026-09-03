import { useEncounter } from '../contexts/Encounter';

export default function useIsEncounterDischarged() {
  const { encounter } = useEncounter();
  return Boolean(encounter?.endDate);
}
