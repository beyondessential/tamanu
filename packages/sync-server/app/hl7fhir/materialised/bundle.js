import { formatRFC3339 } from "date-fns";
import { kebabCase } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { latestDateTime } from 'shared/utils/dateTime';

import { getBaseUrl, getHL7Link } from "../utils";

export class Bundle {
  constructor(type, resources, options = {}) {
    this.type = type;
    this.resources = resources;
    this.options = options;
  }
  
  addSelfUrl(req) {
    const baseUrl = getBaseUrl(req);
    this.options.selfurl = getHL7Link(baseUrl, req.query);
  }

  asFhir() {
    const fields =  {
      resourceType: 'Bundle',
      id: uuidv4(),
      type: this.type,
      timestamp: formatRFC3339(new Date),
      meta: {
        lastUpdated: formatRFC3339(latestDateTime(...this.resources.map(r => r.lastUpdated))),
      },
    };

    if (this.options.total) {
      fields.total = this.options.total;
    }

    if (this.options.link) {
      fields.link = this.options.link;
    }
    
    if (this.options.selfurl) {
      fields.link ||= [];
      fields.link.push({
        relation: 'self',
        url: this.options.selfurl,
      });
    }

    fields.entry = this.resources.map(r => {
      const fhir = r.asFhir();
      return {
        resource: fhir,
      };
    });

    return fields;
  }
}
