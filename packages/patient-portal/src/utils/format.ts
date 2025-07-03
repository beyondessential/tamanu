import { SEX_LABELS } from '@tamanu/constants';
import { formatShort } from '@tamanu/utils/dateTime';

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '--/--/----';
  try {
    return formatShort(dateString) || '--/--/----';
  } catch {
    return '--/--/----';
  }
};

export const formatSex = (sex: string | undefined) => {
  if (!sex) return '--';
  return SEX_LABELS[sex as keyof typeof SEX_LABELS] || sex;
};

export const formatDisplayId = (displayId: string | undefined) => {
  return displayId || '--';
};

export const formatName = (name: string | null | undefined) => {
  return name || '--';
};

export const formatVillage = (village: { name?: string } | null | undefined) => {
  return village?.name || '--';
};

// Medication-specific formatting functions
export const formatDose = (doseAmount: number | null | undefined, units: string | undefined) => {
  if (doseAmount === null || doseAmount === undefined || !units) return '--';
  return `${doseAmount} ${units}`;
};

export const formatFrequency = (frequency: string | undefined) => {
  if (!frequency) return '--';
  // This will be enhanced once we integrate with the translation system
  // For now, return the frequency as-is with basic formatting
  return frequency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatRoute = (route: string | undefined) => {
  if (!route) return '--';
  // Basic route formatting - capitalize first letter
  return route.charAt(0).toUpperCase() + route.slice(1);
};

export const formatPrescriber = (prescriber: { displayName?: string } | null | undefined) => {
  return prescriber?.displayName || '--';
};
