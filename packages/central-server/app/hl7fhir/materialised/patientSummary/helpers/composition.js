import { v4 as uuidv4 } from 'uuid';
import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';
import { formatFhirDate } from '@tamanu/shared/utils/fhir';

export const getComposition = ({
  patient,
  user = {},
  integrationsIps,
  now,
  medicationStatements,
  allergyIntolerances,
  conditions,
  immunizations,
}) => {
  return {
    id: uuidv4(),
    resourceType: FHIR_RESOURCE_TYPES.COMPOSITION,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">This is the Composition for ${patient.displayName}.. Please review the data for more detail.</div>`,
    },
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient summary Document',
        },
      ],
    },
    subject: {
      reference: `urn:uuid:${patient.id}`,
    },
    date: formatFhirDate(now),
    author: [
      {
        display: integrationsIps.author,
      },
      ...(user.displayName
        ? [
            {
              display: user.displayName,
            },
          ]
        : []),
    ],
    title: `International Patient Summary as of ${now.toGMTString()}`,
    confidentiality: 'N',
    attester: [
      {
        mode: 'professional',
        time: formatFhirDate(now),
        party: {
          display: integrationsIps.attester,
        },
      },
    ],
    event: [
      {
        code: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass',
                code: 'PCPR',
              },
            ],
          },
        ],
        period: {
          end: formatFhirDate(now),
        },
      },
    ],
    section: [
      {
        title: 'Medication',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">This is the Medication for ${patient.displayName}.. Please review the data for more detail.</div>`,
        },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '10160-0',
              display: 'History of Medication use Narrative',
            },
          ],
        },
        entry: medicationStatements.map(statement => ({
          reference: `urn:uuid:${statement.id}`,
        })),
      },
      {
        title: 'Allergies and Intolerances',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Allergies for ${patient.displayName}.. Please review the data for more detail.</div>`,
        },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '48765-2',
              display: 'Allergies and adverse reactions Document',
            },
          ],
        },
        entry: allergyIntolerances.map(intolerance => ({
          reference: `urn:uuid:${intolerance.id}`,
        })),
      },
      {
        title: 'Active Problems',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Active Problems for ${patient.displayName}.. Please review the data for more detail.</div>`,
        },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11450-4',
              display: 'Problem list Reported',
            },
          ],
        },
        entry: conditions.map(condition => ({
          reference: `urn:uuid:${condition.id}`,
        })),
      },
      {
        title: 'Immunizations',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Immunizations for ${patient.displayName}.. Please review the data for more detail.</div>`,
        },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11369-6',
              display: 'History of Immunization Narrative',
            },
          ],
        },
        entry: immunizations.map(immunization => ({
          reference: `urn:uuid:${immunization.id}`,
        })),
      },
    ],
  };
};
