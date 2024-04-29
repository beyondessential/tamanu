import { FHIR_SEARCH_PARAMETERS } from '@tamanu/constants';

export const searchParameters = {
    collector: {
        type: FHIR_SEARCH_PARAMETERS.REFERENCE,
        path: [['collection', 'collector']],
        referenceTypes: ['Practitioner'],
    },
};