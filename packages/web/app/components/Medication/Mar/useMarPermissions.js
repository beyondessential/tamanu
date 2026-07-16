import { useAuth } from '../../../contexts/Auth';

export default function useMarPermissions() {
  const { ability } = useAuth();
  const canViewMar = ability.can('read', 'MedicationAdministration');
  const canCreateMar = ability.can('create', 'MedicationAdministration');

  return { canCreateMar, canViewMar };
}
