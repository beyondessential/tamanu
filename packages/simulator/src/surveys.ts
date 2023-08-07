import { TamanuApi } from '@tamanu/api-client';

export interface Survey {
  id: string;
  code: string;
  name: string;
  surveyType: SurveyType;
  isSensitive: boolean;
  programId: string;
  components: SurveyComponent[];
}

export type SurveyType = 'vitals';

export interface SurveyComponent {
  id: string;
  screenIndex: number;
  componentIndex: number;
  text: string;
  detail: string;
  config: SurveyComponentConfig;
  calculation: string;
  visibilityCriteria: SurveyComponentCriteria;
  validationCriteria: SurveyComponentCriteria;
  dataElement: SurveyComponentDataElement;
}

export interface SurveyComponentConfig {
  unit?: string;
  rounding?: string;
}

export interface SurveyComponentCriteria extends SurveyComponentCriteriaRange {
  normalRange?: SurveyComponentCriteriaRange | SurveyComponentCriteriaAgeRange[];
}

export interface SurveyComponentCriteriaRange {
  min?: number;
  max?: number;
}

export interface SurveyComponentCriteriaAgeRange extends SurveyComponentCriteriaRange {
  ageUnit: string;
  ageMin: number;
  ageMax?: number;
}

export interface SurveyComponentDataElement {
  id: string;
  code: string;
  name: string;
  type: SurveyComponentDataElementType;
  defaultOptions: {
    [key: string]: string;
  };
}

export type SurveyComponentDataElementType = 'Number' | 'Select' | 'DateTime' | 'CalculatedQuestion';

function parseSurvey(data: unknown): Survey {
  return {
    ...(data as Partial<Survey>),
    components: (data as { components: unknown[] }).components.map((component) => {
      const { config, visibilityCriteria, validationCriteria } = component as Record<
        string,
        string
      >;
      return {
        ...(component as Partial<SurveyComponent>),
        config: config ? JSON.parse(config) : {},
        visibilityCriteria: visibilityCriteria ? JSON.parse(visibilityCriteria) : {},
        validationCriteria: validationCriteria ? JSON.parse(validationCriteria) : {},
      } as SurveyComponent;
    }),
  } as Survey;
}

const surveys: Map<string, Survey> = new Map();
const pendingSurveys: Map<string, Promise<Survey>> = new Map();

export async function getSurvey(api: TamanuApi, id: string): Promise<Survey> {
  const extant = surveys.get(id);
  if (extant) return extant;

  const pending = pendingSurveys.get(id);
  if (pending) return pending;

  const promise = api.get(`survey/${id}`).then(async (data: unknown) => {
    const survey = parseSurvey(data);
    surveys.set(id, survey);
    return survey;
  });
  pendingSurveys.set(id, promise);
  return promise;
}
