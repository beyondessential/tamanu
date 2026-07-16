import { useAuth } from '../../../contexts/Auth';

/**
 * Whether the current user may view this medication (including sensitive drugs).
 * @param {Object} [medication] - medication reference (with `referenceDrug`)
 * @returns {boolean}
 */
export default function useCanViewMedication(medication) {
  const { ability } = useAuth();
  const isSensitive = medication?.referenceDrug?.isSensitive;

  return !isSensitive || ability.can('read', 'SensitiveMedication');
}
