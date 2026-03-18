import { DataTypes, Op, Sequelize, type InitOptions } from 'sequelize';
import type { Ability } from '@casl/ability';

import {
  FHIR_INTERACTIONS,
  SERVICE_REQUEST_CATEGORY_CODES,
  SERVICE_REQUEST_PERMISSION_NOUNS,
  FHIR_INTEGRATION_VERB,
  FHIR_INTEGRATION_PERMISSIONS,
} from '@tamanu/constants';
import { FhirResource } from './Resource';
import type { Models } from '../../types/model';
import {
  fromImagingRequests,
  fromLabRequests,
  getIsLive,
  getQueryOptions,
  getValues,
  searchParameters,
  shouldForceRematerialise,
} from '../../utils/fhir/ServiceRequest';

function hasFhirPermission(ability: Ability, verb: string, noun: string): boolean {
  if (ability.can(verb, noun)) return true;

  for (const [type, config] of Object.entries(FHIR_INTEGRATION_PERMISSIONS)) {
    const hasFullAccess = ability.can(FHIR_INTEGRATION_VERB, type);
    const hasVerbAccess = ability.can(verb, type);
    if (!hasFullAccess && !hasVerbAccess) continue;
    if (verb === 'read' && config.read.includes(noun)) return true;
    if (verb === 'write' && config.write.includes(noun)) return true;
  }
  return false;
}

function getAllowedCategories(ability: Ability): string[] {
  const categories: string[] = [];
  if (hasFhirPermission(ability, 'read', SERVICE_REQUEST_PERMISSION_NOUNS.LAB)) {
    categories.push(SERVICE_REQUEST_CATEGORY_CODES.LAB);
  }
  if (hasFhirPermission(ability, 'read', SERVICE_REQUEST_PERMISSION_NOUNS.IMAGING)) {
    categories.push(SERVICE_REQUEST_CATEGORY_CODES.IMAGING);
  }
  return categories;
}

export class FhirServiceRequest extends FhirResource {
  declare identifier?: Record<string, any>;
  declare status: string;
  declare intent: string;
  declare category?: Record<string, any>;
  declare priority?: string;
  declare code?: Record<string, any>;
  declare orderDetail?: Record<string, any>;
  declare subject: Record<string, any>;
  declare encounter?: Record<string, any>;
  declare occurrenceDateTime?: string;
  declare requester?: Record<string, any>;
  declare locationCode?: Record<string, any>;
  declare note?: Record<string, any>;
  declare specimen?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        identifier: DataTypes.JSONB,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        intent: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        category: DataTypes.JSONB,
        priority: DataTypes.TEXT,
        code: DataTypes.JSONB,
        orderDetail: DataTypes.JSONB,
        subject: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        encounter: DataTypes.JSONB,
        occurrenceDateTime: DataTypes.TEXT,
        requester: DataTypes.JSONB,
        locationCode: DataTypes.JSONB,
        note: DataTypes.JSONB,
        specimen: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.ImagingRequest, models.LabRequest];
    this.upstreams = [
      models.ImagingRequest,
      models.ImagingRequestArea,
      models.ImagingAreaExternalCode,
      models.ImagingTypeExternalCode,
      models.Encounter,
      models.Facility,
      models.Location,
      models.LocationGroup,
      models.Patient,
      models.ReferenceData,
      models.User,
      models.LabRequest,
      models.LabTest,
      models.LabTestType,
      models.LabTestPanelRequest,
      models.LabTestPanel,
      models.Note,
    ];
    this.referencedResources = [
      models.FhirPatient,
      models.FhirEncounter,
      models.FhirPractitioner,
      models.FhirSpecimen,
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  static applyPermissionsFilterToSearchQuery(
    query: Record<string, any>,
    ability: Ability,
  ): Record<string, any> {
    const allowedCategories = getAllowedCategories(ability);
    if (allowedCategories.length === 0) return query;

    const categoryConditions = allowedCategories.map(code =>
      Sequelize.literal(`category @> '[{"coding": [{"code": "${code}"}]}]'::jsonb`),
    );

    const categoryWhere =
      categoryConditions.length === 1
        ? categoryConditions[0]
        : { [Op.or]: categoryConditions };

    return {
      ...query,
      where: {
        ...query.where,
        [Op.and]: [
          ...(query.where?.[Op.and] ?? []),
          categoryWhere,
        ],
      },
    };
  }

  static checkRecordAccess(ability: Ability, record: FhirResource): void {
    const allowedCategories = getAllowedCategories(ability);
    if (allowedCategories.length === 0) {
      throw new Error('No permission to read ServiceRequest');
    }

    const serviceRequest = record as FhirServiceRequest;
    const recordCategories = serviceRequest.category ?? [];
    const recordCodes = (recordCategories as any[]).flatMap((cat: any) =>
      (cat.coding ?? []).map((coding: any) => coding.code),
    );

    if (!recordCodes.some(code => allowedCategories.includes(code))) {
      throw new Error(`no ServiceRequest with id ${record.id}`);
    }
  }

  async updateMaterialisation() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    const values = await getValues(upstream!, this.sequelize.models);
    this.set(values);
  }

  async updateIsLive() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    const isLive = getIsLive(upstream!, this.sequelize.models);
    this.isLive = isLive;
  }

  async shouldForceRematerialise() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    return shouldForceRematerialise(upstream!, this, this.sequelize.models);
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable: string, table: string, id: string) {
    const { ImagingRequest, LabRequest } = this.sequelize.models;

    if (upstreamTable === ImagingRequest.tableName) {
      return fromImagingRequests(this.sequelize.models, table, id);
    }
    if (upstreamTable === LabRequest.tableName) {
      return fromLabRequests(this.sequelize.models, table, id);
    }
    return null;
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      ...searchParameters,
    };
  }
}
