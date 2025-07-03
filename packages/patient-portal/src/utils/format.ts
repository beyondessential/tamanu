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
