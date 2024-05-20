import { TEMPLATE_TYPES, TEMPLATE_TYPE_LABELS } from '@tamanu/constants';

export const TEMPLATE_TYPE_OPTIONS = Object.values(TEMPLATE_TYPES).map(type => ({
  value: type,
  label: TEMPLATE_TYPE_LABELS[type],
}));
