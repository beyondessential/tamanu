import { subDays } from 'date-fns';
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
  'Location',
  'Request ID',
  'Request date and time',
  'Supervising clinician',
  'Requesting clinician',
  'Priority',
  'Imaging type',
  'Area to be imaged',
  'Status',
];

const reportColumnTemplate = FIELDS.map(field =>
  ({
        title: field,
        accessor: data => data[field],
      })
);

const query = `
select 
  p.display_id as "Patient ID",
  p.first_name as "Patient first name" ,
  p.last_name as "Patient last name", 
  to_char(p.date_of_birth ::timestamp::date, 'DD/MM/YYYY') as "DOB",
  date_part('year', age(p.date_of_birth)) as "Age",
  p.sex as "Sex",
  rdv.name as "Village",
  f.name as "Facility",
  d.name as "Department",
  l.name as "Location",
  ir.id as "Request ID",
  to_char(ir.requested_date::timestamp, 'DD/MM/YYYY HH12:MI AM') as "Request date and time",
  u_supervising.display_name as "Supervising clinician",
  u_requesting.display_name as "Requesting clinician",
  case when ir.urgent is true then 'Urgent'
  else 'Standard'
  end as "Priority",
  ir.imaging_type as "Imaging type",
  n.content as "Area to be imaged",
  ir.status as "Status"
from
  imaging_requests ir
  left join encounters e on e.id=ir.encounter_id
  left join patients p on p.id=e.patient_id
  left join reference_data rdv on rdv.id=p.village_id
  left join locations l on l.id=e.location_id
  left join facilities f on f.id = l.facility_id
  left join departments d on d.id = e.department_id
  left join users u_supervising on u_supervising.id=e.examiner_id
  left join users u_requesting on u_requesting.id=ir.requested_by_id
  left join notes n on n.record_id = ir.id
where
  n.note_type = 'areaToBeImaged' or n.note_type is null
  and case when :from_date is not null then e.start_date::date >= :from_date::date else true end
  and case when :to_date is not null then e.start_date::date <= :to_date::date else true end
  and case when :requested_by_id is not null then ir.requested_by_id = :requested_by_id else true end
  and case when :imaging_type is not null then ir.imaging_type = :imaging_type else true end
  and case when :status is not null then ir.status = :status else true end
order by ir.requested_date desc;
`;

const getData = async (sequelize, parameters) => {
  const {
    fromDate = subDays(new Date(), 30),
    toDate,
    requestedById,
    imagingType,
    status,
  } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      requested_by_id: requestedById ?? null,
      imaging_type: imagingType ?? null,
      status: status ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'ImagingRequest';
