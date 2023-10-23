import config from 'config';
import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { toDateTimeString } from '../utils/dateTime';
import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  'Reporting period',
  'Number of admissions',
  'Number of discharges',
  'Number of deaths',
  'Number of patient days',
  'Number of internal transfers',
  'Average length of stay',
  'Bed occupancy (%)',
];

const reportColumnTemplate = FIELDS.map(field => ({
  title: field,
  accessor: data => data[field],
}));

const query = `
with
  -- Default reporting date range - all months
  reporting_months as (
    select month::date
    from
      generate_series(
        case when :from_date is not null then :from_date::date else '2022-05-01'::date end,
        case when :to_date is not null then :to_date::date else current_date::date end,
        '1 month'::interval
      ) month
  ),
  admission_data as (
    select
      e.start_date::date start_date,
      e.end_date::date end_date,
      e.id,
      e.patient_id,
      e.department_id,
      e.end_date::date - e.start_date::date as length_of_stay,
      f.name facility_name
    from
      encounters e
      join departments d on e.department_id = d.id
      join facilities f on d.facility_id = f.id
    where
      e.encounter_type = 'admission' 
      and e.patient_id != '5d9043ff-6745-4bca-b1c7-1c7751bad1f0'
      and e.deletion_status = :deletionStatus
      and f.id = '${config.serverFacilityId}'
  ),
  admissions as (
    select
      rm.month,
      a.facility_name,
      count(a.id) num
    from
      reporting_months rm
      left join admission_data a on a.start_date between rm.month and (rm.month + interval '1' month - interval '1' day)
    group by rm.month, a.facility_name
  ),
  patient_discharged as (
    select
      rm.month,
      a.facility_name,
      count(a.id) num,
      round(avg(a.length_of_stay),2) avg_stay
    from
      reporting_months rm
      left join admission_data a on a.end_date between rm.month and (rm.month + interval '1' month - interval '1' day)
    group by rm.month, a.facility_name
  ),
  patient_deaths as (
    select
      rm.month,
      a.facility_name,
      count(a.id) num
    from
      reporting_months rm
      left join admission_data a on a.end_date between rm.month and (rm.month + interval '1' month - interval '1' day)
      left join patients p on p.id = a.patient_id
    where p.date_of_death::date = a.end_date
    group by rm.month, a.facility_name
  ),
  patient_days as (
    select
      rm.month,
      a.facility_name,
      sum(case
          when a.start_date > a.end_date then 0
          when a.start_date = a.end_date then 1
          when a.start_date < rm.month and rm.month > (current_date - interval '1' month) and a.end_date isnull then current_date - rm.month
          when a.start_date < rm.month and a.end_date <= (rm.month + interval '1' month - interval '1' day) then a.end_date - rm.month
          when a.start_date < rm.month and (a.end_date > (rm.month + interval '1' month - interval '1' day) or a.end_date isnull) then (rm.month + interval '1' month)::date - rm.month
          when a.start_date >= rm.month and rm.month > (current_date - interval '1' month) and a.end_date isnull then current_date - a.start_date
          when a.start_date >= rm.month and a.end_date <= (rm.month + interval '1' month - interval '1' day) then a.end_date - a.start_date
          when a.start_date >= rm.month and (a.end_date > (rm.month + interval '1' month - interval '1' day) or a.end_date isnull) then (rm.month + interval '1' month)::date - a.start_date
      end) as num
    from
      reporting_months rm
      left join admission_data a on (a.start_date <= (rm.month + interval '1' month - interval '1' day)) and (a.end_date >= rm.month or a.end_date is null)
    group by rm.month, a.facility_name
  ),
  internal_transfer as (
    select
      rm.month,
      a.facility_name,
      count(n.id) num
    from
      reporting_months rm
      left join admission_data a on a.start_date between rm.month and (rm.month + interval '1' month - interval '1' day)
      left join notes n on a.id = n.record_id
    where n.note_type = 'system' and n.content like 'Changed department%'
    group by rm.month, a.facility_name
  ),
  available_beds as (
    select
      f.name as facility_name,
      case
        when f.name = 'Ba Hospital' then 73
        when f.name = 'Lautoka Hospital' then 309
      end num_of_beds
    from facilities f
  ),
  p_days_beds as (
    select
      p_days.month,
      p_days.facility_name,
      p_days.num as patient_days,
      ab.num_of_beds,
      round((p_days.num::numeric) / (ab.num_of_beds *
        case
          when p_days.month > (current_date - interval '1' month) then current_date - p_days.month
          else (p_days.month + interval '1' month )::date - p_days.month
        end
        )*100, 2) bed_occupancy    
    from
      patient_days p_days
      left join available_beds ab on p_days.facility_name = ab.facility_name
  )
select
  to_char(a.month, 'Mon-YY') as "Reporting period",
  a.num as "Number of admissions",
  discharge.num as "Number of discharges",
  death.num as "Number of deaths",
  beds.patient_days as "Number of patient days",
  transfer.num as "Number of internal transfers",
  discharge.avg_stay as "Average length of stay",
  concat(beds.bed_occupancy,'%') as "Bed occupancy (%)"
from
  admissions a
  left join patient_discharged discharge on discharge.month = a.month
  left join patient_deaths death on death.month = a.month
  left join p_days_beds beds on beds.month = a.month
  left join internal_transfer transfer on transfer.month = a.month
order by a.month;
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate } = parameters;

  const queryFromDate = fromDate && toDateTimeString(startOfDay(parseISO(fromDate)));
  const queryToDate = toDate && toDateTimeString(endOfDay(parseISO(toDate)));

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: queryFromDate ?? null,
      to_date: queryToDate ?? null,
      deletionStatus: null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};
