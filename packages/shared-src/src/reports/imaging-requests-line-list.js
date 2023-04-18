import { subDays } from 'date-fns';
import { toDateTimeString } from 'shared/utils/dateTime';
import { IMAGING_REQUEST_STATUS_CONFIG } from '../constants';
import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  'Patient ID',
  'Patient first name',
  'Patient last name',
  'DOB',
  'Age',
  'Sex',
  'Village',
  'Facility',
  'Department',
  'Area',
  'Request ID',
  'Request date and time',
  'Supervising clinician',
  'Requesting clinician',
  'Priority',
  'Imaging type',
  'Area to be imaged',
  'Status',
  'Reason for cancellation',
];

// Reason for cancellation is a configurable field but these are the default values
const DEFAULT_REASONS_FOR_CANCELLATION = {
  clinical: 'Clinical reason',
  duplicate: 'Duplicate',
  'entered-in-error': 'Entered in error',
  'patient-discharged': 'Patient discharged',
  'patient-refused': 'Patient refused',
  other: 'Other',
};

const reportColumnTemplate = FIELDS.map(field => {
  if (field === 'Status') {
    return {
      title: field,
      accessor: data =>
        IMAGING_REQUEST_STATUS_CONFIG[data[field]]
          ? IMAGING_REQUEST_STATUS_CONFIG[data[field]].label
          : data[field],
    };
  }

  if (field === 'Reason for cancellation') {
    return {
      title: field,
      accessor: data => DEFAULT_REASONS_FOR_CANCELLATION[data[field]] ?? data[field],
    };
  }

  return {
    title: field,
    accessor: data => data[field],
  };
});

const query = `
select 
  p.display_id as "Patient ID",
  p.first_name as "Patient first name" ,
  p.last_name as "Patient last name", 
  to_char(p.date_of_birth ::timestamp::date, 'DD/MM/YYYY') as "DOB",
  date_part('year', age(p.date_of_birth::date)) as "Age",
  p.sex as "Sex",
  rdv.name as "Village",
  f.name as "Facility",
  d.name as "Department",
  locationGroup.name as "Area",
  ir.display_id as "Request ID",
  to_char(ir.requested_date::timestamp, 'DD/MM/YYYY HH12:MI AM') as "Request date and time",
  u_supervising.display_name as "Supervising clinician",
  u_requesting.display_name as "Requesting clinician",
  ir.priority as "Priority",
  ir.imaging_type as "Imaging type",
  case
    when ira.id is not null then rdi.name
    else ni.content
    end as "Area to be imaged",
  ir.status as "Status",
  case
      when ir.status = 'cancelled' then ir.reason_for_cancellation
      else null
      end as "Reason for cancellation"
from
  imaging_requests ir
  left join encounters e on e.id=ir.encounter_id
  left join patients p on p.id=e.patient_id
  left join reference_data rdv on rdv.id=p.village_id
  left join locations l on l.id=e.location_id
  left join location_groups locationGroup on l.location_group_id=locationGroup.id
  left join facilities f on f.id = l.facility_id
  left join departments d on d.id = e.department_id
  left join users u_supervising on u_supervising.id=e.examiner_id
  left join users u_requesting on u_requesting.id=ir.requested_by_id
  left join note_pages np on np.record_id = ir.id and np.note_type = 'areaToBeImaged'
  left join note_items ni on np.id = ni.note_page_id
  left join imaging_request_areas ira on ira.imaging_request_id = ir.id
  left join reference_data rdi on rdi.id = ira.area_id
where
  case when :from_date is not null then ir.requested_date::date >= :from_date::date else true end
  and case when :to_date is not null then ir.requested_date::date <= :to_date::date else true end
  and case when :requested_by_id is not null then ir.requested_by_id = :requested_by_id else true end
  and case when :imaging_type is not null then ir.imaging_type = :imaging_type else true end
  and case when :areStatuses is not null then ir.status IN(:statuses) else true end
order by ir.requested_date;
`;

const getData = async (sequelize, parameters) => {
  const {
    fromDate = toDateTimeString(subDays(new Date(), 30)),
    toDate,
    requestedById,
    imagingType,
    statuses,
  } = parameters;

  const selectedStatuses = statuses?.split(', ') ?? null;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      requested_by_id: requestedById ?? null,
      imaging_type: imagingType ?? null,
      statuses: selectedStatuses,
      areStatuses: selectedStatuses ? 'true' : null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'ImagingRequest';
