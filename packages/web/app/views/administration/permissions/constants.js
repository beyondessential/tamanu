export const NOUN_TYPES = {
  // Noun-level permission (e.g. Patient, Encounter)
  NOUN: 'noun',

  // Expandable group containing per-object permission rows
  // (e.g. Survey (objectID) which would expand to show all the individual Surveys)
  OBJECT_ID_GROUP: 'objectIdGroup',

  // Individual Child Object ID (e.g. Survey 123, Survey 456, Survey 789) within the group
  OBJECT_ID: 'objectId',
};
