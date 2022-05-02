```


with 
	responses_with_answers as (
		select
			response_id,
			jsonb_agg(
				jsonb_build_object(
					data_element_id, body
				) 
			) "answers"
		from survey_response_answers sra
		where body <> '' -- Doesn't really matter, just could save some memory
		and sra.deleted_at is null
		group by response_id 
	)
select
	p.first_name,
	p.last_name,
	to_char(p.date_of_birth::date, 'yyyy-mm-dd') as dob,
	p.sex,
	p.display_id as patient_id,
	rd.name as village,
	to_char(sr.end_time::date, 'yyyy-mm-dd') endtime,
	s.name,
	answers
from survey_responses sr
left join responses_with_answers a on sr.id = a.response_id 
left join encounters e on e.id = sr.encounter_id
left join patients p on p.id = e.patient_id
left join reference_data rd on rd.id = p.village_id
join surveys s on s.id = sr.survey_id
where sr.survey_id  = 'program-samoancdscreening-sampenkapsur' 
and sr.deleted_at is null
-- and p.deleted_at is null
and p.display_id != 'QCJL976947'
```;
