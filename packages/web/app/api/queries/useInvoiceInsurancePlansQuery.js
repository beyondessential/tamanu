import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { SETTING_KEYS } from '@tamanu/constants';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { areAnySlidingFeeScaleFieldsShown } from '../../utils/slidingFeeScale';

/** Every insurance plan available at the current facility, each with its code. */
export const useInvoiceInsurancePlansQuery = ({ enabled = true } = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(
    ['invoiceInsurancePlans', facilityId],
    () =>
      api.get(route('suggestions/:endpoint/all', { endpoint: 'invoiceInsurancePlan' }), {
        facilityId,
      }),
    { enabled },
  );
};

/**
 * The plan the deployment has named as its sliding fee scale plan, which is what makes family size
 * and annual income required on a patient's billing details. Matched on the plan's code rather
 * than its name, which is translated and worded differently between deployments. The id is null
 * while the plans are loading and when no plan carries the configured code, so `isLoading` is what
 * tells those two apart.
 */
export const useSlidingFeeScalePlanId = () => {
  const { getSetting } = useSettings();
  const slidingFeeScalePlanCode = getSetting(SETTING_KEYS.SLIDING_FEE_SCALE_PLAN_CODE);

  // The id is only ever used to decide whether family size and annual income are required, so a
  // deployment that hides both, or names no plan, has no reason to fetch the plans at all — the
  // patient details form waits on this query before it renders.
  const isNeeded =
    Boolean(slidingFeeScalePlanCode) && areAnySlidingFeeScaleFieldsShown(getSetting);

  const { data: plans, isLoading, error } = useInvoiceInsurancePlansQuery({ enabled: isNeeded });

  // A caller that validates against the id has to wait for the plans, since an unresolved id is
  // indistinguishable from a deployment with no sliding fee scale plan, and would quietly let a
  // patient save without the answers that plan requires. A failed fetch is surfaced as an error
  // rather than silently switching the requirement off.
  const slidingFeeScalePlanId =
    plans?.find(({ code }) => code === slidingFeeScalePlanCode)?.id ?? null;

  // A code matching no plan reads exactly like a deployment that has not configured one, so the
  // requirement stops applying with nothing to show for it. Say so where a mistyped or retired
  // code can be found, rather than leaving it to turn up in unbilled assessments.
  useEffect(() => {
    if (!isNeeded || isLoading || error || slidingFeeScalePlanId) return;
    console.warn(
      `No insurance plan carries the configured sliding fee scale plan code "${slidingFeeScalePlanCode}", so family size and annual income are not required on patient details.`,
    );
  }, [isNeeded, isLoading, error, slidingFeeScalePlanId, slidingFeeScalePlanCode]);

  if (!isNeeded) return { slidingFeeScalePlanId: null, isLoading: false, error: null };
  return { slidingFeeScalePlanId, isLoading, error };
};
