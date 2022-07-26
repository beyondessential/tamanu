import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  "Patient Name",
  "MRID",
  "DOB",
  "Sex",
  "Village",
  "Patient Type",
  "Appointment Date",
  "Time Slot",
  "Clinic",
  "Appointment Status",
  "Clinician",
  "Location",
];

const reportColumnTemplate = FIELDS.map(field => ({
  title: field,
  accessor: data => data[field],
}));

const query = `
with
	billing_type as (
		select 
			patient_id,
			max(billing.name) billing_type_name
		from patient_additional_data
		join reference_data billing on billing.id = patient_billing_type_id
		group by patient_id
	)
select
	case when
		p.middle_name is not null
		then p.first_name || ' ' || p.middle_name || ' ' || p.last_name
	    else p.first_name || ' ' || p.last_name
	end "Patient Name",
	p.display_id "MRID",
	to_char(p.date_of_birth, 'YYYY-MM-DD') "DOB",
	p.sex "Sex",
	vil.name "Village",
	bt.billing_type_name "Patient Type",
	to_char(a.start_time, 'YYYY-MM-DD') "Appointment Date",
	to_char(a.start_time, 'HH12' || CHR(58) || 'MI AM') "Time Slot",
	a."type" "Clinic",
	a.status "Appointment Status",
	u.display_name "Clinician",
	l.name "Location"
from appointments a
join patients p on p.id = a.patient_id
left join reference_data vil on vil.id = p.village_id
left join billing_type bt on bt.patient_id = p.id
left join users u on u.id = a.clinician_id
left join locations l on l.id = a.location_id
where CASE WHEN :location_id IS NOT NULL THEN l.id = :location_id ELSE true end 
AND CASE WHEN :from_date IS NOT NULL THEN a.start_time::date >= :from_date::date ELSE true END
AND CASE WHEN :to_date IS NOT NULL THEN a.start_time::date <= :to_date::date ELSE true end
and case when :appointment_status is not null then a.status = :appointment_status else true end
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate, appointmentStatus, location } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      appointment_status: appointmentStatus ?? null,
      location_id: location ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'Appointment';

