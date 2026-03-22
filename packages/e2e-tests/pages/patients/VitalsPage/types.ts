export const VITALS_FIELD_KEYS = [
    'heightCm', 'weightKg', 'bmi', 'sbp', 'dbp', 'map',
    'heartRate', 'respiratoryRate', 'temperature', 'spo2', 'spo2OnOxygen',
    'avpu', 'tewScore', 'gcs', 'painScale', 'capillaryRefillTime',
    'randomBgl', 'fastingBgl', 'ventilatorFlow', 'ventilatorMode',
    'fio2', 'pip', 'peep', 'rate', 'inspiratoryTime', 'tidalVolume', 'minuteVentilation',
  ] as const;

export type VitalsValues = Record<typeof VITALS_FIELD_KEYS[number], string>;