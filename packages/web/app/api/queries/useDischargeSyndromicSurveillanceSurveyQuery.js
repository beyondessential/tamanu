import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

/**
 * The syndromic surveillance form, for completing within the discharge form. Fetched through the
 * encounter because doing so is covered by the permission to discharge it, not the form's own.
 */
export const useDischargeSyndromicSurveillanceSurveyQuery = (
  encounterId,
  { enabled = true } = {},
) => {
  const api = useApi();

  return useQuery(
    ['dischargeSyndromicSurveillanceSurvey', encounterId],
    () =>
      api.get(`encounter/${encodeURIComponent(encounterId)}/syndromicSurveillance/dischargeSurvey`),
    { enabled: Boolean(encounterId) && enabled },
  );
};
