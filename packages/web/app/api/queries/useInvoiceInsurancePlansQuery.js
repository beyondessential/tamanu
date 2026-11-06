import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { SETTING_KEYS } from '@tamanu/constants';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';

/** Every insurance plan available at the current facility, each with its code. */
export const useInvoiceInsurancePlansQuery = () => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(['invoiceInsurancePlans', facilityId], () =>
    api.get(route('suggestions/:endpoint/all', { endpoint: 'invoiceInsurancePlan' }), {
      facilityId,
    }),
  );
};

/**
 * The plan the deployment has named as its sliding fee scale plan, which is what makes family size
 * and annual income required on a patient's billing details. Matched on the plan's code rather
 * than its name, which is translated and worded differently between deployments. Null while the
 * plans are loading, and when no plan carries the configured code.
 */
export const useSlidingFeeScalePlanId = () => {
  const { getSetting } = useSettings();
  const { data: plans } = useInvoiceInsurancePlansQuery();
  const slidingFeeScalePlanCode = getSetting(SETTING_KEYS.SLIDING_FEE_SCALE_PLAN_CODE);

  if (!slidingFeeScalePlanCode) return null;
  return plans?.find(({ code }) => code === slidingFeeScalePlanCode)?.id ?? null;
};
