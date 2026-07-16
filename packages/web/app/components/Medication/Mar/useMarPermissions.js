import { useAuth } from '../../../contexts/Auth';

/**
 * MAR-related ability checks for a medication row.
 * @param {Object} [medication]
 */
export default function useMarPermissions(medication) {
  const { ability } = useAuth();
  const canViewMar = ability.can('read', 'MedicationAdministration');
  const canCreateMar = ability.can('create', 'MedicationAdministration');
  const canView =
    !medication?.medication?.referenceDrug?.isSensitive ||
    ability.can('read', 'SensitiveMedication');

  return { canCreateMar, canView, canViewMar };
}
