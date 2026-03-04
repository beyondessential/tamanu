export const CHARTING_FIELD_KEYS = [
  'dateTime',
  'gcsEyeOpening',
  'gcsVerbalResponse',
  'gcsMotorResponse',
  'gcsTotalScore',
  'rightPupilsSize',
  'rightPupilsReaction',
  'leftPupilsSize',
  'leftPupilsReaction',
  'rightArmLimbMovement',
  'rightLegLimbMovement',
  'leftArmLimbMovement',
  'leftLegLimbMovement',
  'comments',
] as const;

export type ChartingValues = Record<typeof CHARTING_FIELD_KEYS[number], string>;

