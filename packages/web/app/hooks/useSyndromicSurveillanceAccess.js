import { useSettings } from '../contexts/Settings';
import { useAuth } from '../contexts/Auth';
import { useEncounterSyndromicSurveillanceQuery } from '../api/queries/useEncounterSyndromicSurveillanceQuery';

/**
 * Whether syndromic surveillance should be shown for this encounter, its recorded data (if any),
 * and the permission-derived rules for editing it — shared by the diagnosis pane and the discharge
 * form, which both gate their syndromic surveillance section on the same feature flag and
 * permissions.
 *
 * "Create" applies when recording for the first time (no prior values); "write" applies when
 * editing an already-recorded entry. Either one on its own, or plain "read", is enough to view.
 */
export const useSyndromicSurveillanceAccess = encounterId => {
  const { getSetting } = useSettings();
  const { ability } = useAuth();

  const canCreate = ability.can('create', 'SyndromicSurveillance');
  const canWrite = ability.can('write', 'SyndromicSurveillance');
  const canView = canCreate || canWrite || ability.can('read', 'SyndromicSurveillance');
  const show = getSetting('syndromicSurveillance.enableSyndromicSurveillance') && canView;

  const { data, isFetched } = useEncounterSyndromicSurveillanceQuery(encounterId, {
    enabled: show,
  });
  const isRecorded = Boolean(data);

  return {
    show,
    data,
    isFetched,
    isRecorded,
    canCreate,
    canWrite,
    canEdit: isRecorded ? canWrite : canCreate,
  };
};
