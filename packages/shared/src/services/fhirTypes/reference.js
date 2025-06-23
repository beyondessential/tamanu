import * as yup from 'yup';
import { lowerCase, snakeCase } from 'lodash';

import { FhirBaseType } from './baseType';
import { FhirIdentifier } from './identifier';

const UPSTREAM_REF_TYPE_PREFIX = 'upstream://';

export class FhirReference extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        // on ancestor: Element
        id: yup.string().nullable().default(null),

        reference: yup.string().nullable().default(null),

        // In spec's schema, this is of type "uri", but it is later
        // mentioned that it can be `"Patient"` as a shorthand, so
        // it can't be the `url()` type in yup.
        type: yup.string().nullable().default(null),

        identifier: FhirIdentifier.asYup().nullable().default(null),
        display: yup.string().nullable().default(null),
      })
      .noUnknown();
  }

  static unresolvedReferenceType(resourceModel) {
    return `${UPSTREAM_REF_TYPE_PREFIX}${snakeCase(lowerCase(resourceModel.fhirName))}`;
  }

  static async to(resourceModel, upstreamId, fields) {
    const resource = upstreamId ? await resourceModel.findOne({ where: { upstreamId } }) : null;
    if (!resource || !resource.resolved) {
      return this.unresolved(resourceModel, upstreamId, fields);
    }

    return this.resolved(resourceModel, resource.id, fields);
  }

  static resolved(resourceModel, id, fields) {
    return new this({
      type: resourceModel.fhirName,
      reference: `${resourceModel.fhirName}/${id}`,
      ...fields,
    });
  }

  static unresolved(resourceModel, upstreamId, fields) {
    return new this({
      type: this.unresolvedReferenceType(resourceModel),
      reference: upstreamId,
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      type: model,
      display: `${fieldName}.${id}`,
    });
  }

  fhirTypeAndId() {
    const TYPE_ID_URL_REGEX = /\/?(?<type>\w+)\/(?<id>[0-9a-f-]+)$/i;

    const { reference } = this;
    if (!reference) return null;

    const match = TYPE_ID_URL_REGEX.exec(reference);
    if (match) {
      return {
        type: match.groups.type,
        id: match.groups.id,
      };
    }

    return null;
  }

  isResolved() {
    return !!this.reference && !this.type.startsWith(UPSTREAM_REF_TYPE_PREFIX);
  }
}
