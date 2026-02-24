import { FHIR_BUNDLE_TYPES } from '@tamanu/constants';
import { FhirSearchSetBundle } from '@tamanu/shared/services/fhirTypes';
import { formatFhirDate, OperationOutcome } from '@tamanu/shared/utils/fhir';
import crypto from 'crypto';

import { getBaseUrl, getHL7Link } from '../../utils';

export class SearchBundleResponse {
  included = [];

  issues = [];

  constructor(resources, options = {}) {
    this.resources = resources;
    this.options = options;
  }

  addSelfUrl(req) {
    const baseUrl = getBaseUrl(req);
    this.options.selfurl = getHL7Link(baseUrl, req.query);
  }

  addIncluded(included) {
    this.included = this.included.concat(included);
  }

  addIssues(issues) {
    this.issues = this.issues.concat(issues);
  }

  get includes() {
    return new Set(this.included.map(r => r.fhirName));
  }

  asFhir() {
    const bundleData = {
      resourceType: 'Bundle',
      id: crypto.randomUUID(),
      type: FHIR_BUNDLE_TYPES.SEARCHSET,
      timestamp: formatFhirDate(new Date()),
    };

    if (typeof this.options.total === 'number') {
      bundleData.total = this.options.total;
    }

    if (this.options.link) {
      bundleData.link = this.options.link;
    }

    if (this.options.selfurl) {
      bundleData.link ||= [];
      bundleData.link.push({
        relation: 'self',
        url: this.options.selfurl,
      });
    }

    bundleData.entry = this.resources
      .map(r => resourceToEntry(r, 'match'))
      .concat(this.included.map(r => resourceToEntry(r, 'include')));

    if (this.issues.length > 0) {
      const oo = new OperationOutcome(this.issues);
      oo.downgradeErrorsToWarnings();
      bundleData.issues = oo.asFhir();
    }

    return new FhirSearchSetBundle(bundleData);
  }
}

function resourceToEntry(resource, searchMode) {
  const entry = { resource: resource.asFhir() };

  entry.search = {
    mode: searchMode,
  };

  return entry;
}
