import { describe, expect, it } from 'vitest';
import { DataTypes, Sequelize } from 'sequelize';

import {
  FHIR_DATETIME_PRECISION,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_PREFIXES,
} from '@tamanu/constants';

import { singleMatch } from '../../../../src/routes/fhir/search/where';

// A JSONB path is rendered as `value <op> ANY(SELECT jsonb_path_query(...))`, which
// swaps the operands relative to the search's own `resource <op> value` reading. The
// operator therefore has to be flipped to its converse, and getting that wrong (taking
// the complement instead) moves the boundary case from one prefix to its twin. These
// tests read the operator straight out of the emitted SQL, because an end-to-end search
// cannot currently tell the two mappings apart — see the D2 card.

// No connection is opened: selectQuery is a pure string builder.
const sequelize = new Sequelize({ dialect: 'postgres' });
const FhirEncounter = sequelize.define(
  'FhirEncounter',
  { actualPeriod: DataTypes.JSONB, status: DataTypes.TEXT },
  { tableName: 'encounters', timestamps: false },
);

function renderWhere(where) {
  return sequelize.dialect.queryGenerator.selectQuery(
    'encounters',
    { where, model: FhirEncounter },
    FhirEncounter,
  );
}

function renderSingleMatch(path, paramQuery, paramDef) {
  const [match] = singleMatch(path, paramQuery, paramDef, FhirEncounter);
  return renderWhere(match);
}

function dateQuery(prefix, sql) {
  return { value: [{ prefix, date: { sql } }] };
}

const DATE_PARAM = {
  type: FHIR_SEARCH_PARAMETERS.DATE,
  datePrecision: FHIR_DATETIME_PRECISION.SECONDS,
};

describe('singleMatch', () => {
  describe('ordering comparisons on a JSONB path', () => {
    // Each prefix must land on its converse, not its complement. The complement of
    // `>` is `<=`, which would make a `gt` search match a resource value equal to the
    // search value — that is `ge` behaviour, and the FHIR search spec is explicit that
    // only `ge`/`le` admit the boundary case.
    const CONVERSES = [
      [FHIR_SEARCH_PREFIXES.GT, '<'],
      [FHIR_SEARCH_PREFIXES.GE, '<='],
      [FHIR_SEARCH_PREFIXES.LT, '>'],
      [FHIR_SEARCH_PREFIXES.LE, '>='],
    ];

    it.each(CONVERSES)('flips %s to its converse %s', (prefix, expectedOperator) => {
      const sql = renderSingleMatch(
        ['actualPeriod', 'start'],
        dateQuery(prefix, '2024-01-01 05:00:00'),
        DATE_PARAM,
      );

      expect(sql).toContain(`'2024-01-01 05:00:00' ${expectedOperator} any(select(`);
    });

    it('does not flip a symmetric comparison', () => {
      const sql = renderSingleMatch(
        ['actualPeriod', 'start'],
        dateQuery(FHIR_SEARCH_PREFIXES.EQ, '2024-01-01 05:00:00'),
        DATE_PARAM,
      );

      expect(sql).toContain(`'2024-01-01 05:00:00' = any(select(`);
    });

    it('keeps the GIN pre-scan condition alongside the comparison', () => {
      const sql = renderSingleMatch(
        ['actualPeriod', 'start'],
        dateQuery(FHIR_SEARCH_PREFIXES.GT, '2024-01-01 05:00:00'),
        DATE_PARAM,
      );

      expect(sql).toContain(`"actualPeriod" @? '$.start'`);
    });
  });

  describe('a single-column path', () => {
    it('uses the operator directly, with no flip', () => {
      const sql = renderSingleMatch(
        ['status'],
        dateQuery(FHIR_SEARCH_PREFIXES.GT, '2024-01-01 05:00:00'),
        DATE_PARAM,
      );

      expect(sql).toContain(`"status" > '2024-01-01 05:00:00'`);
    });
  });

  describe('string matching on a JSONB path', () => {
    // fhir.<~* is the converse of ~*: op_inverse_regexi(regex, value) is defined in the
    // baseline migration as `value ~* regex`, so the same predicate with swapped operands.
    it('flips a case-insensitive regex to the custom converse operator', () => {
      const sql = renderSingleMatch(['name', '[]', 'family'], { value: ['Smith'] }, {
        type: FHIR_SEARCH_PARAMETERS.STRING,
      });

      expect(sql).toContain(`'^Smith.*' OPERATOR(fhir.<~*) ANY(SELECT jsonb_path_query(`);
    });

    it('does not flip an exact match', () => {
      const sql = renderSingleMatch(
        ['name', '[]', 'family'],
        { value: ['Smith'], modifier: 'exact' },
        { type: FHIR_SEARCH_PARAMETERS.STRING },
      );

      expect(sql).toContain(`'Smith' = any(select(`);
    });
  });
});
