import config from 'config';
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
  admission_data as (
    select
      timezone('Pacific/Fiji', e.start_date::date)::date start_date,
      timezone('Pacific/Fiji', e.end_date::date)::date end_date,
      e.id,
      e.patient_id,
      e.department_id,
      f.name facility_name
    from
      encounters e
      join departments d on e.department_id = d.id
      join facilities f on d.facility_id = f.id
    where
      e.encounter_type = 'admission' and e.patient_id != '5d9043ff-6745-4bca-b1c7-1c7751bad1f0'
      and f.id = '${config.serverFacilityId}'
  ),
  admission_start_date_base as (
    select
      a.*,
      extract(month from a.start_date) start_date_m,
      extract(month from a.end_date) end_date_m,
      date_trunc('month', a.start_date) start_date_d,
      date_trunc('month', a.end_date) end_date_d
    from admission_data a
    where
      case when :from_date is not null then a.start_date::date >= :from_date::date else true end
      and case when :to_date is not null then a.start_date::date <= :to_date::date else true end
  ),
  admission_end_date_base as (
    select
      a.*,
      extract(month from a.start_date) start_date_m,
      extract(month from a.end_date) end_date_m,
      date_trunc('month', a.start_date) start_date_d,
      date_trunc('month', a.end_date) end_date_d
    from admission_data a
    where
      case when :from_date is not null then a.end_date::date >= :from_date::date else true end
      and case when :to_date is not null then a.end_date::date <= :to_date::date else true end
  ),
  reporting_period as (
    select
      reporting_month,
      extract(month from reporting_month) reporting_month_m,
      facility_name
    from (
      select
        start_date_d reporting_month,
        facility_name
      from admission_start_date_base
      group by reporting_month, facility_name
      union
      select end_date_d reporting_month, facility_name
      from admission_end_date_base
      group by reporting_month, facility_name
    ) as all_periods
    order by reporting_month
  ),
  admissions as (
    select a.start_date_d reporting_month,
      a.facility_name,
      count(a.id) number_of_admissions
    from admission_start_date_base a
    group by reporting_month, a.facility_name
  ),
  patient_discharged as (
    select a.end_date_d reporting_month,
      facility_name,
      count(a.id) number_of_discharges,
      sum(date_part('day', age(
        case
          when a.end_date = a.start_date then a.end_date + 1
          else a.end_date
        end
      , a.start_date))) patient_days
    from admission_end_date_base a
    group by reporting_month, facility_name
  ),
  patient_deaths as (
    select a.end_date_d reporting_month,
      facility_name,
      count(p.id) number_of_deaths
    from admission_end_date_base a
    join patients p on a.patient_id = p.id
    where timezone('Pacific/Fiji', p.date_of_death::date)::date = a.end_date
    group by reporting_month, facility_name
  ),
  -- patients are still in admission, no end_date
  patient_days_no_discharged as (
    select rp.reporting_month, facility_name,
      (select sum(
        case
          -- start_date = current month
          when a.start_date_m = extract(month from timezone('Pacific/Fiji', current_date)::date) and (a.start_date_m = rp.reporting_month_m) then
             -- patient days = current date - start_date
            date_part('day', age(timezone('Pacific/Fiji', current_date)::date, a.start_date))
          -- start date is in the same month as reporting month
          when a.start_date_m = rp.reporting_month_m then
            -- patient days =last day of the month - start_date
            date_part('day', age((a.start_date_d + interval '1 month')::date, a.start_date))
          -- start date in previous month
          when (a.start_date_m < rp.reporting_month_m) and (rp.reporting_month_m = extract(month from timezone('Pacific/Fiji', current_date)::date)) then -- less than first day of the reporting month and is not current month
            date_part('day', age(timezone('Pacific/Fiji', current_date)::date, rp.reporting_month))
          when a.start_date < rp.reporting_month then -- less than first day of the reporting month
            -- patient days = # of days in the reporting month
            date_part('days',(rp.reporting_month + interval '1 month - 1 day'))
        end) num_patient_days
      from admission_start_date_base a
      where a.end_date is null-- still in admission
      and a.facility_name = rp.facility_name
      )
    from reporting_period rp
  ),
  --   start_date and end_date are in the same month but not the same day
  --   patient_days = end_date - start_date
  patient_days_same_months as (
    select a.start_date_d reporting_month,
      sum(date_part('day', age(a.end_date , a.start_date))) num_patient_days,
      facility_name
    from admission_start_date_base a
    where a.end_date_m = a.start_date_m -- discharge in the same month
    and a.end_date::date <> a.start_date::date -- but not in the same day
    group by reporting_month, facility_name
  ),
  -- start_date and end_date are in the same day
  -- patient_days = number of patients that have a day stay
  patient_days_same_day as (
    select a.start_date_d reporting_month,
      count(a.id) num_patient_days,
      facility_name
    from admission_start_date_base a
    where a.end_date::date = a.start_date::date -- same day
    group by reporting_month, facility_name
  ),
  -- cases where start date and end date are exists but not in the same month and not in the same day
  patient_days_prior_admission as (
    select rp.reporting_month, facility_name,
        (select sum(
          case
            -- start date in current reporting month
            when a.start_date_m = rp.reporting_month_m then
              -- patient_days = last day of the month - start_date
              date_part('day', age((a.start_date_d + interval '1 month')::date, a.start_date))
            -- start_date before reporting_month and end_date after reporting_month
            when rp.reporting_month_m > a.start_date_m and rp.reporting_month_m < a.end_date_m then
              -- patient_days = # of days in the reporting month
              date_part('days',(rp.reporting_month + interval '1 month - 1 day'))
            -- end date is in current reporting month
            when rp.reporting_month_m = a.end_date_m then
              -- patient_days = end date - first day of the month
              date_part('day', age(a.end_date, a.end_date_d::date))
          end
        )
        from admission_end_date_base a
        where a.facility_name = rp.facility_name
        and a.end_date_m > a.start_date_m) num_patient_days --  admission in previous month
      from reporting_period rp
  ),
  patient_days_all as (
    select reporting_month, sum(num_patient_days) num_patient_days, facility_name
    from
    (
      select pd1.reporting_month, pd1.num_patient_days, pd1.facility_name
      from patient_days_no_discharged pd1
      union
      select pd2.reporting_month, pd2.num_patient_days, pd2.facility_name
      from patient_days_same_months pd2
      union
      select pd3.reporting_month, pd3.num_patient_days, pd3.facility_name
      from patient_days_prior_admission pd3
      union
      select pd4.reporting_month, pd4.num_patient_days, pd4.facility_name
      from patient_days_same_day pd4
    )  as patient_days_sub
    group by reporting_month, facility_name
  ),
  internal_transfer as (
    select a.start_date_d reporting_month,
      count(ni.id) number_of_internal_transfer,
      a.facility_name
    from admission_start_date_base a
    join note_pages np on a.id = np.record_id -- encounter_id = record_id
    join note_items ni on np.id = ni.note_page_id
    where np.note_type = 'system' and lower(ni.content) like 'changed department%'
    group by reporting_month, facility_name
  ),
  available_beds as (
    select reporting_month,
      facility_name,
      case
        when facility_name = 'Ba Hospital' then 73
        when facility_name = 'Lautoka Hospital' then 309
      end num_of_beds
    from patient_days_all
  ),
  p_days_beds as (
    select
      p_days.reporting_month,
      p_days.facility_name,
      sum(p_days.num_patient_days) tot_patient_days,
      round(avg((p_days.num_patient_days / (ab.num_of_beds *
        case
          when p_days.reporting_month = date_trunc('month', timezone('Pacific/Fiji', current_date)::date) then
            date_part('days', timezone('Pacific/Fiji', current_date)::date) - 1
          else
            date_part('days',(p_days.reporting_month + interval '1 month - 1 day'))
        end
      )*100)::numeric), 2) bed_occupancy
    from patient_days_all p_days
    join available_beds ab on p_days.facility_name = ab.facility_name
    where p_days.reporting_month = ab.reporting_month
    group by p_days.reporting_month, p_days.facility_name
  )
select
  to_char(rp.reporting_month,'Mon-YY') "Reporting period",
  sum(a.number_of_admissions) "Number of admissions",
  sum(p_discharged.number_of_discharges) "Number of discharges",
  sum(p_deaths.number_of_deaths) "Number of deaths",
  sum(p_days.tot_patient_days) "Number of patient days",
  sum(it.number_of_internal_transfer) "Number of internal transfers",
  avg(round((p_discharged.patient_days / p_discharged.number_of_discharges)::numeric, 2)) "Average length of stay",
  sum(p_days.bed_occupancy) "Bed occupancy (%)"
from
  reporting_period rp
  left join admissions a on (rp.reporting_month = a.reporting_month) and (rp.facility_name = a.facility_name)
  left join internal_transfer it on (rp.reporting_month = it.reporting_month) and (rp.facility_name = it.facility_name)
  left join p_days_beds p_days on (rp.reporting_month = p_days.reporting_month) and (rp.facility_name = p_days.facility_name)
  left join patient_deaths p_deaths on (rp.reporting_month = p_deaths.reporting_month) and (rp.facility_name = p_deaths.facility_name)
  left join patient_discharged p_discharged on (rp.reporting_month = p_discharged.reporting_month) and (rp.facility_name = p_discharged.facility_name)
group by rp.reporting_month
order by rp.reporting_month;
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'Encounter';
