import { DataTypes } from 'sequelize';
import {
  CAN_ACCESS_ALL_FACILITIES,
  REPORT_EXPORT_FORMATS,
  REPORT_REQUEST_STATUSES,
  REPORT_REQUEST_STATUS_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';
import { getPermissionsForEachRole } from '@tamanu/shared/permissions/rolesToPermissions';
import { canRunReport } from '@tamanu/shared/reports/utilities/canRunReport';
import { InvalidOperationError } from '@tamanu/errors';
import { isEmailAddress } from '@tamanu/utils/isEmailAddress';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { User } from './User';
import type { ModelSanitizeArgs, SyncSnapshotAttributes } from '../types/sync';

const REPORT_EXPORT_FORMAT_VALUES = Object.values(REPORT_EXPORT_FORMATS);

type PushedReportRequest = ModelSanitizeArgs<{
  recipients?: unknown;
  parameters?: unknown;
  requestedByUserId?: string;
  reportDefinitionVersionId?: string;
  reportType?: string;
}>;

/** What ReportRequest.prepareSanitizeContext resolves for a batch of pushed requests. */
interface SanitizeContext {
  /** Whether the user a request names as its requester may run the report it names. */
  canRun: (request: PushedReportRequest) => boolean;
}

const parseParameters = (parameters: unknown) =>
  (typeof parameters === 'string' ? safeJsonParse(parameters) : null) ?? {};

const getReportIdOf = (request: PushedReportRequest) =>
  request.reportDefinitionVersionId || request.reportType;

/**
 * The email addresses a pushed request asks for, or null if the recipients are not a non-empty
 * list of email addresses. Accepts the JSON `{ email: [...] }` shape, and the older plain
 * comma-separated string.
 */
const parseEmailRecipients = (recipients: unknown): string[] | null => {
  if (typeof recipients !== 'string') return null;

  const parsed = safeJsonParse(recipients);
  const emails =
    parsed === null
      ? recipients.split(',').map(address => address.trim())
      : (parsed as { email?: unknown })?.email;

  if (!Array.isArray(emails) || emails.length === 0) return null;
  return emails.every(isEmailAddress) ? emails : null;
};

const filterAsync = async <T>(items: T[], predicate: (item: T) => Promise<boolean>) => {
  const kept: T[] = [];
  for (const item of items) {
    if (await predicate(item)) kept.push(item);
  }
  return kept;
};

/** Whether a user may use at least one of the facilities a sync session is for. */
const canUseAnyFacility = async (user: User, facilityIds: string[]) => {
  const allowedFacilityIds = await user.allowedFacilityIds();
  if (allowedFacilityIds === CAN_ACCESS_ALL_FACILITIES) return facilityIds.length > 0;
  return facilityIds.some(facilityId => allowedFacilityIds.includes(facilityId));
};

export class ReportRequest extends Model {
  declare id: string;
  declare reportType?: string;
  declare recipients: string;
  declare parameters?: string;
  declare status: (typeof REPORT_REQUEST_STATUS_VALUES)[number];
  declare exportFormat: (typeof REPORT_EXPORT_FORMAT_VALUES)[number];
  declare error?: string;
  declare processStartedTime?: Date;
  declare requestedByUserId?: string;
  declare facilityId?: string;
  declare reportDefinitionVersionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        reportType: { type: DataTypes.STRING },
        recipients: { type: DataTypes.TEXT, allowNull: false },
        parameters: DataTypes.TEXT,
        status: { type: DataTypes.ENUM(...REPORT_REQUEST_STATUS_VALUES), allowNull: false },
        exportFormat: {
          type: DataTypes.ENUM(...REPORT_EXPORT_FORMAT_VALUES),
          allowNull: false,
          defaultValue: REPORT_EXPORT_FORMATS.XLSX,
        },
        error: DataTypes.TEXT,
        processStartedTime: DataTypes.DATE,
      },
      {
        ...options,
        validate: {
          // Must have
          hasReportId: () => {
            // No validation on deleted records
            if (!(this as any).deletedAt) return;

            if (!(this as any).reportDefinitionVersionId && !(this as any).reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a reportDefinitionVersionId',
              );
            }
            if ((this as any).reportDefinitionVersionId && (this as any).reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a reportDefinitionVersionId, not both',
              );
            }
          },
        },
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'requestedByUserId', allowNull: false },
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.ReportDefinitionVersion, {
      foreignKey: 'reportDefinitionVersionId',
      as: 'reportDefinitionVersion',
    });
  }

  /**
   * Resolves once for the whole batch whether each requesting user may run their report, so the
   * per-record sanitiser can stay synchronous. A user or report that cannot be found, or whose
   * permissions cannot be resolved, may not run it. Nor may a user who cannot use any of the
   * facilities the pushing sync session is for, since a facility only raises requests for the
   * users it serves.
   */
  static async prepareSanitizeContext(
    changes: SyncSnapshotAttributes[],
    sessionId?: string,
  ): Promise<SanitizeContext> {
    const { models } = this.sequelize!;
    const requests = changes.map(({ data }) => data as PushedReportRequest);

    const userIds = [...new Set(requests.map(r => r.requestedByUserId).filter(Boolean))];
    const reportIds = [...new Set(requests.map(getReportIdOf).filter(Boolean))];
    const session = sessionId ? await models.SyncSession!.findByPk(sessionId) : null;
    const sessionFacilityIds: string[] = session?.get('parameters')?.facilityIds ?? [];
    const users = await filterAsync(await models.User!.findAll({ where: { id: userIds } }), user =>
      canUseAnyFacility(user, sessionFacilityIds),
    );
    const versions = await models.ReportDefinitionVersion!.findAll({ where: { id: reportIds } });
    const definitions = await models.ReportDefinition!.findAll({
      where: { id: [...new Set(versions.map(version => version.get('reportDefinitionId')))] },
    });

    // Users mostly share a handful of roles, so each role's permissions are read once
    const roles = [...new Set(users.map(user => user.get('role') as string))];
    const permissionsByRole = await getPermissionsForEachRole(models, roles);
    const abilityByUserId = new Map<string, unknown>();
    for (const user of users) {
      const permissions = permissionsByRole.get(user.get('role'));
      if (!permissions) continue;
      try {
        abilityByUserId.set(user.get('id'), buildAbilityForUser(user, permissions));
      } catch (e) {
        log.warn(`Could not resolve permissions for user ${user.get('id')}: ${e}`);
      }
    }

    const definitionById = new Map(
      definitions.map(definition => [definition.get('id'), definition]),
    );
    const definitionByReportId = new Map(
      versions.map(version => [
        version.get('id'),
        definitionById.get(version.get('reportDefinitionId')),
      ]),
    );

    return {
      canRun: request => {
        const ability = abilityByUserId.get(request.requestedByUserId!);
        const definition = definitionByReportId.get(getReportIdOf(request)!);
        if (!ability || !definition) return false;
        return canRunReport(ability, definition, parseParameters(request.parameters));
      },
    };
  }

  /**
   * A report request is only ever created by the facility route, which writes recipients as
   * `{ email }` after checking the user may run the report. A pushed request is held to that:
   * recipients are rebuilt as a list of email addresses and nothing else, and a request that
   * cannot be held to it is stored as an error, which the processor leaves unrun.
   */
  static sanitizeForCentralServer(values: PushedReportRequest, context?: SanitizeContext) {
    const reject = (error: string) => ({
      ...values,
      recipients: JSON.stringify({ email: [] }),
      status: REPORT_REQUEST_STATUSES.ERROR,
      error,
    });

    const emails = parseEmailRecipients(values.recipients);
    if (!emails) return reject('Invalid recipients');
    // without a context nothing has been checked, so the request is refused rather than run
    if (!context?.canRun(values)) {
      return reject('Requesting user cannot run this report');
    }
    return { ...values, recipients: JSON.stringify({ email: emails }) };
  }

  getReportId() {
    return this.reportDefinitionVersionId || this.reportType;
  }

  getParameters() {
    try {
      return JSON.parse(this.parameters!);
    } catch (e) {
      log.warn(`Failed to parse ReportRequest parameters ${e}`);
      return {};
    }
  }

  getRecipients() {
    try {
      return JSON.parse(this.recipients);
    } catch (e) {
      // Backwards compatibility: support previous syntax of plain string
      return {
        email: this.recipients.split(','),
      };
    }
  }
}
