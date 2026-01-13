-- SQL query to count patients marked for sync, grouped by facility and period (month)
-- Output format matches DHIS2 CSV import format
SELECT 
  'num_patients' AS dataelement,
  TO_CHAR(DATE_TRUNC('month', pf.created_at), 'YYYYMM') AS period,
  pf.facility_id AS orgunit,
  '' AS categoryoptioncombo,
  '' AS attributeoptioncombo,
  COUNT(DISTINCT pf.patient_id)::text AS value,
  '' AS storedby,
  '' AS lastupdated,
  '' AS comment,
  '' AS followup,
  '' AS deleted
FROM patient_facilities pf
WHERE pf.deleted_at IS NULL
GROUP BY 
  pf.facility_id,
  DATE_TRUNC('month', pf.created_at)
ORDER BY 
  period,
  orgunit;
