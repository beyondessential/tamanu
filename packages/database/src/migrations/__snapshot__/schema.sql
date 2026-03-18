--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18
-- Dumped by pg_dump version 14.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fhir; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA fhir;


--
-- Name: logs; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA logs;


--
-- Name: sync_snapshots; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA sync_snapshots;


--
-- Name: en_numeric; Type: COLLATION; Schema: public; Owner: -
--

CREATE COLLATION public.en_numeric (provider = icu, locale = 'en@colNumeric=yes');


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: date_string; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.date_string AS character(10);


--
-- Name: date_time_string; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.date_time_string AS character(19);


--
-- Name: enum_encounters_encounter_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_encounters_encounter_type AS ENUM (
    'admission',
    'clinic',
    'imaging',
    'emergency',
    'observation',
    'triage',
    'surveyResponse'
);


--
-- Name: enum_encounters_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_encounters_type AS ENUM (
    'issue',
    'warning'
);


--
-- Name: enum_imaging_requests_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_imaging_requests_status AS ENUM (
    'pending',
    'completed'
);


--
-- Name: enum_lab_request_logs_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_lab_request_logs_status AS ENUM (
    'reception_pending',
    'results_pending',
    'to_be_verified',
    'verified',
    'published',
    'deleted'
);


--
-- Name: enum_lab_tests_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_lab_tests_status AS ENUM (
    'reception_pending',
    'results_pending',
    'to_be_verified',
    'verified',
    'published'
);


--
-- Name: enum_notes_note_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_notes_note_type AS ENUM (
    'system',
    'other',
    'treatmentPlan'
);


--
-- Name: enum_notes_record_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_notes_record_type AS ENUM (
    'Encounter',
    'Patient',
    'Triage',
    'PatientCarePlan',
    'LabRequest'
);


--
-- Name: enum_patient_communications_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_communications_channel AS ENUM (
    'Email',
    'Sms',
    'WhatsApp'
);


--
-- Name: enum_patient_communications_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_communications_status AS ENUM (
    'Queued',
    'Processed',
    'Sent',
    'Error',
    'Delivered',
    'Bad Format'
);


--
-- Name: enum_patient_communications_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_communications_type AS ENUM (
    'Referral created',
    'Certificate'
);


--
-- Name: enum_patient_issues_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_issues_type AS ENUM (
    'issue',
    'warning'
);


--
-- Name: enum_patients_sex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patients_sex AS ENUM (
    'male',
    'female',
    'other'
);


--
-- Name: enum_program_data_elements_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_program_data_elements_type AS ENUM (
    'FreeText',
    'Multiline',
    'Radio',
    'Select',
    'Date',
    'SubmissionDate',
    'Instruction',
    'Number',
    'Binary',
    'Checkbox',
    'CalculatedQuestion',
    'ConditionQuestion',
    'Arithmetic',
    'Condition',
    'Result',
    'SurveyLink',
    'SurveyAnswer',
    'SurveyResult',
    'Autocomplete',
    'Photo',
    'Geolocate',
    'DaysSince',
    'MonthsSince',
    'YearsSince',
    'Entity',
    'PrimaryEntity',
    'CodeGenerator'
);


--
-- Name: enum_referral_diagnoses_certainty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_referral_diagnoses_certainty AS ENUM (
    'suspected',
    'confirmed',
    'made_in_error'
);


--
-- Name: enum_report_requests_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_report_requests_status AS ENUM (
    'Received',
    'Processed'
);


--
-- Name: enum_vitals_avpu; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_vitals_avpu AS ENUM (
    'alert',
    'verbal',
    'pain',
    'unresponsive'
);


--
-- Name: job_backlog(text, boolean); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_backlog(for_topic text, include_dropped boolean, OUT count bigint) RETURNS bigint
    LANGUAGE plpgsql STABLE STRICT PARALLEL SAFE
    AS $$
    BEGIN
      IF include_dropped THEN
        SELECT COUNT(*) INTO count
        FROM fhir.jobs
        WHERE topic = for_topic
        AND (
          status = 'Queued'
          OR (
            status = 'Grabbed'
            AND updated_at < current_timestamp - interval '10 seconds'
          )
          OR (
            status = 'Started'
            AND NOT fhir.job_worker_is_alive(worker_id)
          )
        );
      ELSE
        SELECT COUNT(*) INTO count
        FROM fhir.jobs
        WHERE topic = for_topic
        AND status = 'Queued';
      END IF;
    END;
    $$;


--
-- Name: job_backlog_until_limit(text, bigint, boolean); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_backlog_until_limit(for_topic text, the_limit bigint, include_dropped boolean, OUT count bigint) RETURNS bigint
    LANGUAGE plpgsql STABLE STRICT PARALLEL SAFE
    AS $$
    BEGIN
      IF include_dropped THEN
        SELECT COUNT(*) INTO count
        FROM (
          SELECT 1 FROM fhir.jobs
          WHERE topic = for_topic
          AND status <> 'Errored'
          AND (
            status = 'Queued'
            OR (
              status = 'Grabbed'
              AND updated_at < current_timestamp - interval '10 seconds'
            )
            OR (
              status = 'Started'
              AND NOT fhir.job_worker_is_alive(worker_id)
            )
          )
          LIMIT the_limit
        ) AS limited_jobs;
      ELSE
        SELECT COUNT(*) INTO count
        FROM (
          SELECT 1 FROM fhir.jobs
          WHERE topic = for_topic
          AND status = 'Queued'
          LIMIT the_limit
        ) AS limited_jobs;
      END IF;
    END;
    $$;


--
-- Name: job_complete(uuid, uuid); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_complete(job_id uuid, by_worker_id uuid) RETURNS void
    LANGUAGE plpgsql STRICT
    AS $$
    DECLARE
      job_worker_id UUID;
    BEGIN
      IF NOT fhir.job_worker_is_alive(by_worker_id) THEN
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;

      SELECT worker_id FROM fhir.jobs WHERE id = job_id INTO job_worker_id;
      IF job_worker_id != by_worker_id THEN
        RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
      END IF;

      DELETE FROM fhir.jobs WHERE id = job_id;
    END;
    $$;


--
-- Name: job_fail(uuid, uuid, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_fail(job_id uuid, by_worker_id uuid, error_message text) RETURNS void
    LANGUAGE plpgsql STRICT
    AS $$
    DECLARE
      job_worker_id UUID;
    BEGIN
      IF NOT fhir.job_worker_is_alive(by_worker_id) THEN
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;

      SELECT worker_id FROM fhir.jobs WHERE id = job_id INTO job_worker_id;
      IF job_worker_id != by_worker_id THEN
        RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
      END IF;

      UPDATE fhir.jobs
      SET
        status = 'Errored',
        updated_at = current_timestamp,
        errored_at = current_timestamp,
        error = error_message,
        discriminant = uuid_generate_v4() || '::' || discriminant -- prevent future jobs from matching
      WHERE id = job_id;
    END;
    $$;


--
-- Name: job_grab(uuid, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_grab(with_worker uuid, from_topic text, OUT job_id uuid, OUT job_payload jsonb) RETURNS record
    LANGUAGE plpgsql STRICT
    AS $$
    BEGIN
      IF NOT fhir.job_worker_is_alive(with_worker) THEN
        RAISE EXCEPTION 'worker % is not alive', with_worker;
      END IF;
    
      -- The next queued job
      WITH queued_job AS (
        SELECT id, payload, priority, created_at FROM fhir.jobs
        WHERE (
          topic = from_topic
          AND status = 'Queued'
        )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE
        SKIP LOCKED
      ),
      
      -- A currently grabbed job that hasn't been updated in 10 seconds (it may have gone stale)
      grabbed_job AS (
        SELECT id, payload, priority, created_at FROM fhir.jobs
        WHERE (
          topic = from_topic
          AND status = 'Grabbed'
          AND updated_at < CURRENT_TIMESTAMP - INTERVAL '10 seconds'
        )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE
        SKIP LOCKED
      ),
      
      -- A started job whose worker has died
      started_job AS (
        SELECT id, payload, priority, created_at FROM fhir.jobs
        WHERE (
          topic = from_topic
          AND status = 'Started'
          AND NOT fhir.job_worker_is_alive(worker_id)
        )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE
        SKIP LOCKED
      )
     
      -- Of these 3 candidate jobs, grab the highest priority / oldest
      SELECT id, payload INTO job_id, job_payload
      FROM (
        SELECT * FROM queued_job
        UNION 
        SELECT * FROM grabbed_job
        UNION 
        SELECT * FROM started_job
      ) AS candidate_jobs
      ORDER BY priority DESC, created_at ASC
      LIMIT 1;
    
      IF job_id IS NOT NULL THEN
        UPDATE fhir.jobs
        SET
          status = 'Grabbed',
          updated_at = CURRENT_TIMESTAMP,
          started_at = CURRENT_TIMESTAMP,
          worker_id = with_worker
        WHERE id = job_id;
      END IF;
    END;
    $$;


--
-- Name: job_start(uuid, uuid); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_start(job_id uuid, by_worker_id uuid) RETURNS void
    LANGUAGE plpgsql STRICT
    AS $$
    DECLARE
      job_worker_id UUID;
    BEGIN
      IF NOT fhir.job_worker_is_alive(by_worker_id) THEN
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;

      SELECT worker_id FROM fhir.jobs WHERE id = job_id INTO job_worker_id;
      IF job_worker_id != by_worker_id THEN
        RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
      END IF;

      UPDATE fhir.jobs
      SET
        status = 'Started',
        updated_at = current_timestamp
      WHERE id = job_id;
    END;
    $$;


--
-- Name: job_submit(text, jsonb, integer, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_submit(to_topic text, with_payload jsonb, at_priority integer DEFAULT 1000, with_discriminant text DEFAULT public.uuid_generate_v4(), OUT job_id uuid) RETURNS uuid
    LANGUAGE sql STRICT
    AS $$
      INSERT INTO fhir.jobs (topic, discriminant, priority, payload)
      VALUES (to_topic, with_discriminant, at_priority, with_payload)
      ON CONFLICT (discriminant) DO NOTHING
      RETURNING id
    $$;


--
-- Name: job_worker_deregister(uuid); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_worker_deregister(worker_id uuid) RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM fhir.job_workers WHERE id = worker_id
    $$;


--
-- Name: job_worker_garbage_collect(); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_worker_garbage_collect() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM fhir.job_workers
      WHERE updated_at < current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
    $$;


--
-- Name: job_worker_heartbeat(uuid); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_worker_heartbeat(worker_id uuid) RETURNS void
    LANGUAGE sql
    AS $$
      UPDATE fhir.job_workers SET updated_at = current_timestamp WHERE id = worker_id
    $$;


--
-- Name: job_worker_is_alive(uuid); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_worker_is_alive(worker_id uuid, OUT alive boolean) RETURNS boolean
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$
      SELECT coalesce((
        SELECT updated_at > current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
        FROM fhir.job_workers
        WHERE id = worker_id
      ), false)
    $$;


--
-- Name: job_worker_register(jsonb); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.job_worker_register(worker_info jsonb, OUT worker_id uuid) RETURNS uuid
    LANGUAGE sql STRICT
    AS $$
      INSERT INTO fhir.job_workers (metadata) VALUES (worker_info)
      RETURNING id
    $$;


--
-- Name: jobs_notify(); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.jobs_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- avoid ever hitting the queue limit (and failing)
      IF pg_notification_queue_usage() < 0.5 THEN
        NOTIFY jobs;
      END IF;
      RETURN NEW;
    END;
    $$;


--
-- Name: op_inverse_not_regex(text, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.op_inverse_not_regex(regex text, value text) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value !~ regex
    $$;


--
-- Name: op_inverse_not_regexi(text, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.op_inverse_not_regexi(regex text, value text) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value !~* regex
    $$;


--
-- Name: op_inverse_regex(text, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.op_inverse_regex(regex text, value text) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value ~ regex
    $$;


--
-- Name: op_inverse_regexi(text, text); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.op_inverse_regexi(regex text, value text) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value ~* regex
    $$;


--
-- Name: refresh_trigger(); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.refresh_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      payload JSONB;
    BEGIN
      payload := jsonb_build_object(
        'table', (TG_TABLE_SCHEMA::text || '.' || TG_TABLE_NAME::text),
        'op', TG_OP,
        'id', COALESCE(NEW.id, OLD.id)::text,
        'args', to_jsonb(TG_ARGV)
      );
      
      IF TG_OP = 'DELETE' THEN
        payload := payload || jsonb_build_object('deletedRow', OLD);
      END IF;

      PERFORM fhir.job_submit('fhir.refresh.allFromUpstream', payload);
      RETURN NEW;
    END;
    $$;


--
-- Name: trigger_versioning(); Type: FUNCTION; Schema: fhir; Owner: -
--

CREATE FUNCTION fhir.trigger_versioning() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.version_id := uuid_generate_v4();
        RETURN NEW;
      END;
    $$;


--
-- Name: is_audit_changes_enabled(); Type: FUNCTION; Schema: logs; Owner: -
--

CREATE FUNCTION logs.is_audit_changes_enabled() RETURNS boolean
    LANGUAGE plpgsql STABLE PARALLEL SAFE
    AS $$
    BEGIN
      IF get_session_config('audit.pause', 'false')::boolean THEN
        RETURN false;
      END IF;

      RETURN COALESCE(
        (SELECT value::boolean
         FROM settings
         WHERE key = 'audit.changes.enabled'
         AND scope = 'global'),
        false
      );
    END;
    $$;


--
-- Name: record_change(); Type: FUNCTION; Schema: logs; Owner: -
--

CREATE FUNCTION logs.record_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NOT logs.is_audit_changes_enabled() THEN
        RETURN NEW;
      END IF;

      INSERT INTO logs.changes (
        table_oid,
        table_schema,
        table_name,
        updated_by_user_id,
        record_id,
        device_id,
        version,
        reason,
        record_created_at,
        record_updated_at,
        record_deleted_at,
        record_data
      ) VALUES (
        TG_RELID,                 -- table_oid
        TG_TABLE_SCHEMA,          -- table_schema
        TG_TABLE_NAME,            -- table_name
        get_session_config('audit.userid', uuid_nil()::text), -- updated_by_user_id
        NEW.id,                   -- record_id
        local_system_fact('deviceId', 'unknown'), -- device_id,
        local_system_fact('currentVersion', 'unknown'), -- version,
        get_session_config('audit.reason', NULL), -- reason,
        NEW.created_at,           -- created_at
        NEW.updated_at,           -- updated_at
        NEW.deleted_at,           -- deleted_at
        to_jsonb(NEW.*)           -- record_data
      );
      RETURN NEW;
    END;
    $$;


--
-- Name: adjusted_offset(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.adjusted_offset() RETURNS interval
    LANGUAGE plpgsql STABLE PARALLEL SAFE
    AS $$
      BEGIN
        RETURN local_system_fact('timeOffset', '0 microseconds')::interval;
      END;
    $$;


--
-- Name: adjusted_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.adjusted_timestamp() RETURNS timestamp with time zone
    LANGUAGE plpgsql STABLE PARALLEL SAFE
    AS $$
      BEGIN
        RETURN current_timestamp + adjusted_offset();
      END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    display_id character varying(255) NOT NULL,
    first_name character varying(255),
    middle_name character varying(255),
    last_name character varying(255),
    cultural_name character varying(255),
    email character varying(255),
    date_of_birth public.date_string,
    sex public.enum_patients_sex NOT NULL,
    village_id character varying(255),
    additional_details text,
    date_of_death public.date_time_string,
    merged_into_id character varying(255),
    visibility_status character varying(255) DEFAULT 'current'::character varying,
    date_of_birth_legacy timestamp with time zone,
    date_of_death_legacy timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: find_potential_patient_duplicates(json); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_potential_patient_duplicates(patient_data json) RETURNS SETOF public.patients
    LANGUAGE plpgsql STABLE PARALLEL SAFE
    AS $$
    BEGIN      
      RETURN QUERY
      SELECT 
        p.*
      FROM 
        patients p
      WHERE 
        lower(p.first_name) = lower(patient_data->>'firstName') 
        AND lower(p.last_name) = lower(patient_data->>'lastName') 
        AND p.date_of_birth = patient_data->>'dateOfBirth'
        AND p.deleted_at IS NULL;
    END;
    $$;


--
-- Name: first_agg(anyelement, anyelement); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.first_agg(anyelement, anyelement) RETURNS anyelement
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $_$SELECT $1$_$;


--
-- Name: flag_lookup_model_to_rebuild(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.flag_lookup_model_to_rebuild(model_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO local_system_facts (key, value)
      VALUES ('lookupModelsToRebuild', model_name)
      ON CONFLICT (key) DO UPDATE SET value = 
        CASE 
        WHEN local_system_facts.value IS NULL OR local_system_facts.value = '' THEN
	          -- If the value is null or empty, set it to the model name
          model_name
        WHEN model_name = ANY(string_to_array(local_system_facts.value, ',')) THEN
          -- If the model name is already in the array, do nothing
          local_system_facts.value
        ELSE
          -- If the model name is not in the array, add it
          local_system_facts.value || ',' || model_name
        END;
    END;
    $$;


--
-- Name: get_medication_time_slot(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_medication_time_slot(input_datetime timestamp without time zone) RETURNS TABLE(start_time timestamp without time zone, end_time timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
    DECLARE
        input_hour INTEGER;
        slot_start_hour INTEGER;
        slot_end_hour INTEGER;
        base_date DATE;
    BEGIN
        -- Extract hour and minute from input
        input_hour := EXTRACT(HOUR FROM input_datetime);
        base_date := DATE(input_datetime);

        -- Calculate which 2-hour slot this time falls into
        -- Time slots: 00:00-02:00, 02:00-04:00, 04:00-06:00, 06:00-08:00, etc.
        slot_start_hour := (input_hour / 2) * 2;  -- Integer division, then multiply by 2
        slot_end_hour := slot_start_hour + 2;

        -- Handle the edge case where slot_end_hour is 24 (should be 00:00 next day)
        IF slot_end_hour = 24 THEN
            slot_end_hour := 0;
            RETURN QUERY SELECT
                (base_date + (slot_start_hour || ' hours')::INTERVAL)::TIMESTAMP as start_time,
                ((base_date + INTERVAL '1 day') + (slot_end_hour || ' hours')::INTERVAL)::TIMESTAMP as end_time;
        ELSE
            RETURN QUERY SELECT
                (base_date + (slot_start_hour || ' hours')::INTERVAL)::TIMESTAMP as start_time,
                (base_date + (slot_end_hour || ' hours')::INTERVAL)::TIMESTAMP as end_time;
        END IF;
    END;
    $$;


--
-- Name: get_session_config(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_session_config(key text, default_value text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
      full_key TEXT = 'tamanu.' || key;
    BEGIN
      RETURN coalesce(nullif(current_setting(full_key, true), ''), default_value);
    END;
    $$;


--
-- Name: last_agg(anyelement, anyelement); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.last_agg(anyelement, anyelement) RETURNS anyelement
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $_$SELECT $2$_$;


--
-- Name: local_system_fact(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.local_system_fact(the_key text, the_default text) RETURNS text
    LANGUAGE plpgsql STABLE STRICT PARALLEL SAFE
    AS $$
      DECLARE
        the_value text;
      BEGIN
        SELECT value INTO the_value
        FROM local_system_facts WHERE key = the_key;
        IF NOT FOUND THEN
          the_value := the_default;
        END IF;
        RETURN the_value;
      END;
    $$;


--
-- Name: notify_table_changed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_table_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      event_name text;
      payload json;
      changes text[];
    BEGIN
      -- Determine the operation that caused the trigger
      IF TG_OP = 'INSERT' THEN
        event_name := 'INSERT';
      ELSIF TG_OP = 'UPDATE' THEN
        event_name := 'UPDATE';
      ELSIF TG_OP = 'DELETE' THEN
        event_name := 'DELETE';
      ELSIF TG_OP = 'TRUNCATE' THEN
        event_name := 'TRUNCATE';
      END IF;

      IF TG_OP = 'UPDATE' THEN
        SELECT array_agg(changed_columns.column_name) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value  AND old_json.key NOT IN ('created_at','updated_at','deleted_at','updated_at_sync_tick','updated_at_by_field')
          ) as changed_columns INTO changes;
      END IF;

      -- Create the JSON payload with table name and event name
      payload := json_build_object(
        'table', TG_TABLE_NAME,
        'event', event_name,
        'oldId', OLD.id,
		    'newId', NEW.id,
        'changedColumns', changes
      );

      -- Send notification to the 'table_changed' channel with the JSON payload
      PERFORM pg_notify('table_changed', payload::text);

      RETURN NEW;  -- Return the updated row
    END;
    $$;


--
-- Name: op_uuid_eq_varchar(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.op_uuid_eq_varchar(lvalue uuid, rvalue character varying) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT lvalue::varchar = rvalue
    $$;


--
-- Name: op_uuid_ne_varchar(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.op_uuid_ne_varchar(lvalue uuid, rvalue character varying) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT lvalue::varchar <> rvalue
    $$;


--
-- Name: patients_merge_chain_down(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.patients_merge_chain_down(id character varying) RETURNS character varying[]
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$
      WITH RECURSIVE chain(from_id, to_id) AS (
        SELECT NULL::varchar, id
        UNION
        SELECT chain.to_id, patients.id
          FROM chain
          LEFT OUTER JOIN patients
          ON patients.merged_into_id = to_id
          WHERE chain.to_id IS NOT NULL
      )
      SELECT array_agg(from_id)
        FROM chain
        WHERE from_id IS NOT NULL
    $$;


--
-- Name: patients_merge_chain_up(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.patients_merge_chain_up(id character varying) RETURNS character varying[]
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$
      WITH RECURSIVE chain(from_id, to_id) AS (
        SELECT id, NULL::varchar
        UNION
        SELECT patients.merged_into_id, chain.from_id
          FROM chain
          LEFT OUTER JOIN patients
          ON patients.id = from_id
          WHERE chain.from_id IS NOT NULL
      )
      SELECT array_agg(to_id)
        FROM chain
        WHERE to_id IS NOT NULL
    $$;


--
-- Name: set_session_config(text, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_session_config(key text, value text, is_local boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      full_key TEXT = 'tamanu.' || key;
    BEGIN
      PERFORM set_config(full_key, value, is_local);
    END;
    $$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF (to_jsonb(NEW) ? 'updated_at') THEN
            IF (
                (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at')
                AND
                (to_jsonb(NEW)->'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD)->'updated_at')
            ) THEN
                NEW.updated_at := current_timestamp;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$;


--
-- Name: set_updated_at_by_field(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at_by_field() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN

        -- INSERTS
        IF TG_OP = 'INSERT' THEN

          -- if this is a fresh record insert, and updated_at_by_field is set, it indicates the value
          -- has been explicitly passed (e.g. by a sync merge), so return early rather than
          -- overwriting it
          IF NEW.updated_at_by_field IS NOT NULL THEN
            RETURN NEW;
          END IF;

          -- the user has not included updated_at_by_field in the insert, calculate what it should be
          SELECT JSON_OBJECT_AGG(new_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = 'currentSyncTick'))::jsonb
          FROM jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE new_json.value <> 'null'::jsonb AND new_json.key NOT IN ('id','created_at','updated_at','deleted_at','updated_at_sync_tick','updated_at_by_field')
          INTO NEW.updated_at_by_field;
          RETURN NEW;

        END IF;


        -- UPDATES
        IF TG_OP = 'UPDATE' THEN

          -- if this is an update to an existing record, and the updated_at_by_field is different in
          -- the new version, it indicates the value has been explicitly passed (e.g. by a sync merge),
          -- so return early rather than overwriting it
          IF OLD.updated_at_by_field::text <> NEW.updated_at_by_field::text THEN
            RETURN NEW;
          END IF;

          -- the updated_at_by_field has not been changed in the update, calculate it as it has
          -- _probably_ not been explicitly set by the client
          -- note the "probably": there could be a sync merge that happens to result in an unchanged
          -- updated_at_by_field, and this would recalculate and overwrite it, but pleasingly this
          -- case would only occur when none of the field values has been changed during the sync
          -- merge, so the recalculated updated_at_by_field here will also be unchanged!
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT value::bigint FROM local_system_facts WHERE key = 'currentSyncTick'))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key NOT IN ('id','created_at','updated_at','deleted_at','updated_at_sync_tick','updated_at_by_field')
          ) as changed_columns INTO NEW.updated_at_by_field;
          RETURN NEW;

        END IF;
      END
      $$;


--
-- Name: set_updated_at_sync_tick(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at_sync_tick() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF ((SELECT value FROM local_system_facts WHERE key = 'syncTrigger') = 'disabled') THEN
            RETURN NEW;
        END IF;
        -- If setting to "-1" representing "not marked as updated on this client", we actually use
        -- a different number, "-999", to represent that in the db, so that we can identify the
        -- difference between explicitly setting it to not marked as updated (when NEW contains -1),
        -- and having other fields updated without the updated_at_sync_tick being altered (in which
        -- case NEW will contain -999, easily distinguished from -1)
        IF NEW.updated_at_sync_tick = -1 THEN
          NEW.updated_at_sync_tick := -999;
        ELSE
          SELECT value FROM local_system_facts WHERE key = 'currentSyncTick' INTO NEW.updated_at_sync_tick;

          -- take an advisory lock on the current sync tick (if one doesn't already exist), to
          -- record that an active transaction is using this sync tick
          -- see waitForPendingEditsUsingSyncTick for more details
          PERFORM pg_try_advisory_xact_lock_shared(NEW.updated_at_sync_tick);
        END IF;
        RETURN NEW;
      END
      $$;


--
-- Name: setting_get(text, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setting_get(path text, facility character varying DEFAULT NULL::character varying) RETURNS jsonb
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$
      SELECT value
      FROM settings
      WHERE true
        AND key = path
        AND deleted_at IS NULL
        AND (facility_id IS NULL OR facility_id = facility)
      ORDER BY facility_id DESC LIMIT 1 -- prefer facility-specific setting when both matched
    $$;


--
-- Name: setting_on(text, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setting_on(path text, facility character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$
      SELECT setting_get(path, facility) = 'true'
    $$;


--
-- Name: string_translate(text, text, text, json); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.string_translate(i_language text, i_string_id text, i_fallback_string text, i_replacements json) RETURNS text
    LANGUAGE plpgsql
    AS $$
  declare
    translated_string text;
      key_name text;
      key_value text;
  begin
    select text into translated_string from translated_strings where language = i_language and string_id = i_string_id;

    if translated_string is null or translated_string = ''
      then translated_string = i_fallback_string;
    end if;

      -- Loop through each key-value pair in the JSON object
      FOR key_name, key_value IN SELECT * FROM json_each_text(i_replacements) LOOP
          -- Replace placeholders in the input string
          translated_string := REPLACE(translated_string, ':' || key_name, key_value);
      END LOOP;

      RETURN translated_string;
  END;
  $$;


--
-- Name: first(anyelement); Type: AGGREGATE; Schema: public; Owner: -
--

CREATE AGGREGATE public.first(anyelement) (
    SFUNC = public.first_agg,
    STYPE = anyelement,
    PARALLEL = safe
);


--
-- Name: last(anyelement); Type: AGGREGATE; Schema: public; Owner: -
--

CREATE AGGREGATE public.last(anyelement) (
    SFUNC = public.last_agg,
    STYPE = anyelement,
    PARALLEL = safe
);


--
-- Name: <!~; Type: OPERATOR; Schema: fhir; Owner: -
--

CREATE OPERATOR fhir.<!~ (
    FUNCTION = fhir.op_inverse_not_regex,
    LEFTARG = text,
    RIGHTARG = text,
    NEGATOR = OPERATOR(fhir.<~),
    RESTRICT = neqsel
);


--
-- Name: <!~*; Type: OPERATOR; Schema: fhir; Owner: -
--

CREATE OPERATOR fhir.<!~* (
    FUNCTION = fhir.op_inverse_not_regexi,
    LEFTARG = text,
    RIGHTARG = text,
    NEGATOR = OPERATOR(fhir.<~*),
    RESTRICT = neqsel
);


--
-- Name: <~; Type: OPERATOR; Schema: fhir; Owner: -
--

CREATE OPERATOR fhir.<~ (
    FUNCTION = fhir.op_inverse_regex,
    LEFTARG = text,
    RIGHTARG = text,
    NEGATOR = OPERATOR(fhir.<!~),
    RESTRICT = eqsel
);


--
-- Name: <~*; Type: OPERATOR; Schema: fhir; Owner: -
--

CREATE OPERATOR fhir.<~* (
    FUNCTION = fhir.op_inverse_regexi,
    LEFTARG = text,
    RIGHTARG = text,
    NEGATOR = OPERATOR(fhir.<!~*),
    RESTRICT = eqsel
);


--
-- Name: <>; Type: OPERATOR; Schema: public; Owner: -
--

CREATE OPERATOR public.<> (
    FUNCTION = public.op_uuid_ne_varchar,
    LEFTARG = uuid,
    RIGHTARG = character varying,
    NEGATOR = OPERATOR(public.=),
    MERGES,
    HASHES,
    RESTRICT = eqsel,
    JOIN = eqjoinsel
);


--
-- Name: =; Type: OPERATOR; Schema: public; Owner: -
--

CREATE OPERATOR public.= (
    FUNCTION = public.op_uuid_eq_varchar,
    LEFTARG = uuid,
    RIGHTARG = character varying,
    NEGATOR = OPERATOR(public.<>),
    MERGES,
    HASHES,
    RESTRICT = eqsel,
    JOIN = eqjoinsel
);


--
-- Name: encounters; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.encounters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp with time zone NOT NULL,
    status text NOT NULL,
    class jsonb,
    actual_period jsonb,
    subject jsonb,
    location jsonb,
    service_provider jsonb,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: immunizations; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.immunizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    vaccine_code jsonb NOT NULL,
    patient jsonb NOT NULL,
    encounter jsonb,
    occurrence_date_time text,
    lot_number text,
    site jsonb DEFAULT '[]'::jsonb NOT NULL,
    performer jsonb DEFAULT '[]'::jsonb NOT NULL,
    protocol_applied jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: job_workers; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.job_workers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: jobs; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    priority integer DEFAULT 1000 NOT NULL,
    status text DEFAULT 'Queued'::text NOT NULL,
    worker_id uuid,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    errored_at timestamp with time zone,
    error text,
    topic text NOT NULL,
    discriminant text DEFAULT gen_random_uuid() NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: medication_requests; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.medication_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    version_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    upstream_id uuid NOT NULL,
    last_updated timestamp with time zone NOT NULL,
    identifier jsonb,
    status text NOT NULL,
    intent text NOT NULL,
    group_identifier jsonb,
    subject jsonb,
    encounter jsonb,
    medication jsonb,
    authored_on timestamp with time zone,
    requester jsonb,
    recorder jsonb,
    note jsonb,
    dosage_instruction jsonb,
    dispense_request jsonb,
    resolved boolean DEFAULT false NOT NULL,
    is_live boolean DEFAULT true NOT NULL,
    category jsonb
);


--
-- Name: non_fhir_medici_report; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.non_fhir_medici_report (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp with time zone NOT NULL,
    patient_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth character varying(255),
    age integer,
    sex character varying(255) NOT NULL,
    patient_billing_id character varying(255),
    patient_billing_type text,
    encounter_id character varying(255) NOT NULL,
    encounter_start_date character varying(255) NOT NULL,
    encounter_end_date character varying(255),
    discharge_date character varying(255),
    encounter_type jsonb,
    weight numeric,
    visit_type character varying(255) NOT NULL,
    episode_end_status jsonb,
    encounter_discharge_disposition jsonb,
    triage_category text,
    wait_time character varying(255),
    departments jsonb,
    locations jsonb,
    reason_for_encounter text,
    diagnoses jsonb,
    medications jsonb,
    vaccinations jsonb,
    procedures jsonb,
    lab_requests jsonb,
    imaging_requests jsonb,
    notes jsonb,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp with time zone NOT NULL,
    identifier jsonb,
    name text NOT NULL,
    active boolean,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: patients; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    identifier jsonb DEFAULT '[]'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    name jsonb DEFAULT '[]'::jsonb NOT NULL,
    telecom jsonb DEFAULT '[]'::jsonb NOT NULL,
    gender text NOT NULL,
    birth_date text,
    deceased_date_time text,
    address jsonb DEFAULT '[]'::jsonb NOT NULL,
    link jsonb DEFAULT '[]'::jsonb,
    extension jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: practitioners; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.practitioners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp with time zone NOT NULL,
    identifier jsonb,
    name jsonb,
    telecom jsonb,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: service_requests; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.service_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    identifier jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text,
    intent text,
    category jsonb DEFAULT '[]'::jsonb NOT NULL,
    priority text,
    order_detail jsonb DEFAULT '[]'::jsonb NOT NULL,
    location_code jsonb DEFAULT '[]'::jsonb NOT NULL,
    code jsonb,
    subject jsonb,
    requester jsonb,
    occurrence_date_time text,
    encounter jsonb,
    note jsonb,
    specimen jsonb,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: specimens; Type: TABLE; Schema: fhir; Owner: -
--

CREATE TABLE fhir.specimens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    upstream_id character varying(255) NOT NULL,
    last_updated timestamp with time zone NOT NULL,
    collection jsonb,
    request jsonb,
    type jsonb,
    is_live boolean DEFAULT true NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: accesses; Type: TABLE; Schema: logs; Owner: -
--

CREATE TABLE logs.accesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    user_id text NOT NULL,
    record_id text NOT NULL,
    record_type text NOT NULL,
    facility_id text,
    session_id text NOT NULL,
    device_id text NOT NULL,
    logged_at timestamp with time zone NOT NULL,
    front_end_context jsonb NOT NULL,
    back_end_context jsonb NOT NULL,
    is_mobile boolean NOT NULL,
    version text NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: changes; Type: TABLE; Schema: logs; Owner: -
--

CREATE TABLE logs.changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_oid integer NOT NULL,
    table_schema text NOT NULL,
    table_name text NOT NULL,
    logged_at timestamp with time zone DEFAULT public.adjusted_timestamp() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by_user_id text NOT NULL,
    device_id text DEFAULT public.local_system_fact('deviceId'::text, 'unknown'::text) NOT NULL,
    version text DEFAULT public.local_system_fact('currentVersion'::text, 'unknown'::text) NOT NULL,
    record_id text NOT NULL,
    record_created_at timestamp with time zone NOT NULL,
    record_updated_at timestamp with time zone NOT NULL,
    record_deleted_at timestamp with time zone,
    record_data jsonb NOT NULL,
    reason text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: debug_logs; Type: TABLE; Schema: logs; Owner: -
--

CREATE TABLE logs.debug_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(255) NOT NULL,
    info json NOT NULL
);


--
-- Name: fhir_writes; Type: TABLE; Schema: logs; Owner: -
--

CREATE TABLE logs.fhir_writes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    verb text NOT NULL,
    url text NOT NULL,
    body jsonb DEFAULT '{}'::jsonb NOT NULL,
    headers jsonb DEFAULT '{}'::jsonb NOT NULL,
    user_id character varying(255)
);


--
-- Name: migrations; Type: TABLE; Schema: logs; Owner: -
--

CREATE TABLE logs.migrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    logged_at timestamp with time zone DEFAULT public.adjusted_timestamp() NOT NULL,
    record_sync_tick bigint DEFAULT (public.local_system_fact('currentSyncTick'::text, '0'::text))::bigint NOT NULL,
    device_id text DEFAULT public.local_system_fact('deviceId'::text, 'unknown'::text) NOT NULL,
    version text DEFAULT public.local_system_fact('currentVersion'::text, 'unknown'::text) NOT NULL,
    direction text NOT NULL,
    migrations jsonb NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: administered_vaccines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administered_vaccines (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    batch character varying(255),
    status character varying(255) NOT NULL,
    reason character varying(255),
    date public.date_time_string,
    scheduled_vaccine_id character varying(255),
    encounter_id character varying(255),
    injection_site character varying(255),
    consent boolean,
    recorder_id character varying(255),
    location_id character varying(255),
    department_id character varying(255),
    given_by text,
    date_legacy timestamp with time zone,
    not_given_reason_id character varying(255),
    given_elsewhere boolean,
    vaccine_name text,
    vaccine_brand text,
    disease text,
    circumstance_ids character varying(255)[],
    consent_given_by text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: appointment_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    until_date public.date_string,
    "interval" integer NOT NULL,
    frequency character varying(255) NOT NULL,
    days_of_week character varying(255)[],
    nth_weekday integer,
    occurrence_count integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_fully_generated boolean DEFAULT false NOT NULL,
    generated_until_date public.date_string,
    cancelled_at_date public.date_string,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    start_time public.date_time_string,
    end_time public.date_time_string,
    patient_id character varying(255),
    clinician_id character varying(255),
    location_id character varying(255),
    type_legacy character varying(255) DEFAULT 'Standard'::character varying NOT NULL,
    status character varying(255) DEFAULT 'Confirmed'::character varying NOT NULL,
    start_time_legacy timestamp with time zone,
    end_time_legacy timestamp with time zone,
    location_group_id character varying(255),
    booking_type_id character varying(255),
    appointment_type_id character varying(255),
    is_high_priority boolean DEFAULT false NOT NULL,
    encounter_id character varying(255),
    schedule_id uuid,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    data bytea NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    size integer,
    data bytea NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: certifiable_vaccines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certifiable_vaccines (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    vaccine_id character varying(255) NOT NULL,
    manufacturer_id character varying(255),
    icd11_drug_code character varying(255) NOT NULL,
    icd11_disease_code character varying(255) NOT NULL,
    vaccine_code character varying(255) NOT NULL,
    target_code character varying(255),
    eu_product_code character varying(255),
    maximum_dosage integer DEFAULT 1 NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: certificate_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_notifications (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    type character varying(255) NOT NULL,
    require_signing boolean DEFAULT false NOT NULL,
    patient_id character varying(255),
    forward_address character varying(255) DEFAULT NULL::character varying,
    lab_test_id character varying(255),
    status character varying(255) DEFAULT 'Queued'::character varying NOT NULL,
    error text,
    created_by character varying(255),
    lab_request_id character varying(255),
    printed_date public.date_string,
    facility_name character varying(255),
    language character varying(255) DEFAULT 'en'::character varying,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: contributing_death_causes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contributing_death_causes (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    time_after_onset integer NOT NULL,
    patient_death_data_id character varying(255) NOT NULL,
    condition_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: death_revert_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.death_revert_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    revert_time public.date_time_string NOT NULL,
    death_data_id character varying(255) NOT NULL,
    patient_id character varying(255) NOT NULL,
    reverted_by_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    facility_id character varying(255),
    visibility_status text DEFAULT 'current'::text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id text DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    registered_by_id character varying(255) NOT NULL,
    name text,
    scopes jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: discharges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discharges (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    note text,
    encounter_id character varying(255) NOT NULL,
    discharger_id character varying(255),
    disposition_id character varying(255),
    facility_name character varying(255),
    facility_address character varying(255),
    facility_town character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: document_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_metadata (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    document_created_at public.date_time_string,
    document_uploaded_at public.date_time_string NOT NULL,
    document_owner text,
    patient_id character varying(255),
    encounter_id character varying(255),
    attachment_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    department_id character varying(255),
    note character varying(255),
    document_created_at_legacy timestamp with time zone,
    document_uploaded_at_legacy timestamp with time zone,
    source character varying(255) DEFAULT 'uploaded'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounter_diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_diagnoses (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    certainty character varying(255) DEFAULT 'suspected'::character varying,
    is_primary boolean,
    date public.date_time_string NOT NULL,
    encounter_id character varying(255),
    diagnosis_id character varying(255),
    date_legacy timestamp with time zone,
    clinician_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounter_diets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_diets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id character varying(255) NOT NULL,
    diet_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounter_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_time_string NOT NULL,
    encounter_id character varying(255) NOT NULL,
    department_id character varying(255) NOT NULL,
    location_id character varying(255) NOT NULL,
    examiner_id character varying(255) NOT NULL,
    encounter_type character varying(255) NOT NULL,
    actor_id character varying(255),
    change_type character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounter_pause_prescription_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_pause_prescription_histories (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    encounter_prescription_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    action_date public.date_time_string NOT NULL,
    action_user_id character varying(255),
    notes text,
    pause_duration numeric,
    pause_time_unit character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounter_pause_prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_pause_prescriptions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    encounter_prescription_id uuid NOT NULL,
    pause_duration numeric NOT NULL,
    pause_time_unit character varying(255) NOT NULL,
    pause_start_date public.date_time_string NOT NULL,
    pause_end_date public.date_time_string NOT NULL,
    notes text,
    pausing_clinician_id character varying(255),
    created_by character varying(255),
    updated_by character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounter_prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id character varying(255) NOT NULL,
    prescription_id character varying(255) NOT NULL,
    is_selected_for_discharge boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: encounters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounters (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    encounter_type character varying(31) NOT NULL,
    start_date public.date_time_string NOT NULL,
    end_date public.date_time_string,
    reason_for_encounter text,
    device_id text,
    patient_id character varying(255),
    examiner_id character varying(255),
    location_id character varying(255),
    department_id character varying(255),
    patient_billing_type_id character varying(255),
    start_date_legacy timestamp with time zone,
    end_date_legacy timestamp with time zone,
    referral_source_id character varying(255),
    planned_location_id character varying(255),
    planned_location_start_time public.date_time_string,
    discharge_draft jsonb,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facilities (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    division character varying(255),
    type character varying(255),
    email character varying(255),
    contact_number character varying(255),
    city_town character varying(255),
    street_address character varying(255),
    visibility_status text DEFAULT 'current'::text,
    catchment_id text,
    is_sensitive boolean DEFAULT false NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: imaging_area_external_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_area_external_codes (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    visibility_status text DEFAULT 'current'::text NOT NULL,
    area_id character varying(255) NOT NULL,
    code text NOT NULL,
    description text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: imaging_request_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_request_areas (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    imaging_request_id character varying NOT NULL,
    area_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: imaging_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    status character varying(255) DEFAULT 'pending'::public.enum_imaging_requests_status,
    requested_date public.date_time_string NOT NULL,
    encounter_id character varying(255),
    requested_by_id character varying(255),
    legacy_results text DEFAULT ''::character varying,
    completed_by_id character varying(255),
    location_id character varying(255),
    imaging_type character varying(31) DEFAULT NULL::character varying,
    requested_date_legacy timestamp with time zone,
    priority character varying(255),
    location_group_id character varying(255),
    reason_for_cancellation character varying(1024),
    display_id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: imaging_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL,
    visibility_status text DEFAULT 'current'::text NOT NULL,
    imaging_request_id character varying NOT NULL,
    completed_by_id character varying(255),
    description text,
    external_code text,
    completed_at public.date_time_string DEFAULT to_char(CURRENT_TIMESTAMP(3), 'YYYY-MM-DD HH24:MI:SS'::text) NOT NULL,
    result_image_url text
);


--
-- Name: invoice_discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_discounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    percentage numeric NOT NULL,
    reason character varying(255),
    is_manual boolean NOT NULL,
    applied_by_user_id character varying(255) NOT NULL,
    applied_time public.date_time_string NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_insurer_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_insurer_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_payment_id uuid NOT NULL,
    insurer_id character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    reason character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_insurers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_insurers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    insurer_id character varying(255) NOT NULL,
    percentage numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_item_discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_item_discounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_item_id uuid NOT NULL,
    amount numeric NOT NULL,
    reason character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    type character varying(255) DEFAULT 'percentage'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    order_date public.date_string NOT NULL,
    product_id character varying(255),
    quantity integer NOT NULL,
    product_name character varying(255) DEFAULT ''::character varying NOT NULL,
    product_price numeric DEFAULT 0 NOT NULL,
    ordered_by_user_id character varying(255) NOT NULL,
    source_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    product_code character varying(255) DEFAULT ''::character varying NOT NULL,
    note character varying(255),
    product_discountable boolean DEFAULT true NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_patient_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_patient_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_payment_id uuid NOT NULL,
    method_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    cheque_number character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    date public.date_string NOT NULL,
    receipt_number character varying(255) NOT NULL,
    amount numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    updated_by_user_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoice_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_products (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price numeric,
    discountable boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    visibility_status character varying(255) DEFAULT 'current'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    display_id character varying(255) NOT NULL,
    date public.date_time_string NOT NULL,
    status character varying(255) NOT NULL,
    encounter_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    patient_payment_status character varying(255) DEFAULT 'unpaid'::character varying NOT NULL,
    insurer_payment_status character varying(255) DEFAULT 'unpaid'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: ips_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ips_requests (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    patient_id character varying(255) NOT NULL,
    created_by character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    error text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_request_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_request_attachments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    attachment_id character varying(255) NOT NULL,
    lab_request_id character varying(255) NOT NULL,
    title character varying(255),
    replaced_by_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_request_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_request_logs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    status character varying(31) NOT NULL,
    lab_request_id character varying(255),
    updated_by_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_requests (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    sample_time public.date_time_string,
    requested_date public.date_time_string,
    urgent boolean DEFAULT false,
    specimen_attached boolean DEFAULT false,
    status character varying(255) DEFAULT 'reception_pending'::character varying,
    senaite_id character varying(255),
    sample_id character varying(255),
    requested_by_id character varying(255),
    encounter_id character varying(255),
    lab_test_category_id character varying(255),
    display_id character varying(255) NOT NULL,
    lab_test_priority_id character varying(255),
    lab_test_laboratory_id character varying(255),
    sample_time_legacy timestamp with time zone,
    requested_date_legacy timestamp with time zone,
    reason_for_cancellation character varying(31),
    department_id character varying(255),
    lab_test_panel_request_id uuid,
    lab_sample_site_id character varying(255),
    published_date public.date_time_string,
    specimen_type_id character varying(255),
    collected_by_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_test_panel_lab_test_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_test_panel_lab_test_types (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    lab_test_panel_id character varying(255) NOT NULL,
    lab_test_type_id character varying(255) NOT NULL,
    id text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_test_panel_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_test_panel_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    lab_test_panel_id character varying(255) NOT NULL,
    encounter_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_test_panels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_test_panels (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    visibility_status character varying(255) DEFAULT 'current'::character varying NOT NULL,
    external_code text,
    category_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_test_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_test_types (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    code character varying(255) NOT NULL,
    name character varying(255) DEFAULT ''::character varying NOT NULL,
    unit character varying(255) DEFAULT ''::character varying NOT NULL,
    male_min double precision,
    male_max double precision,
    female_min double precision,
    female_max double precision,
    range_text character varying(255),
    result_type character varying(255) NOT NULL,
    options text,
    lab_test_category_id character varying(255),
    visibility_status text DEFAULT 'current'::text,
    external_code text,
    is_sensitive boolean DEFAULT false NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: lab_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_tests (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_string NOT NULL,
    result character varying(255) DEFAULT ''::character varying NOT NULL,
    lab_request_id character varying(255),
    lab_test_type_id character varying(255),
    category_id character varying(255),
    lab_test_method_id character varying(255),
    laboratory_officer character varying(255),
    completed_date public.date_time_string,
    verification character varying(255),
    date_legacy timestamp with time zone,
    completed_date_legacy timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: local_system_facts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.local_system_facts (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    key character varying(255) NOT NULL,
    value text
);


--
-- Name: location_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_groups (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    visibility_status text DEFAULT 'current'::text,
    name character varying(255) NOT NULL COLLATE public.en_numeric,
    code character varying(255) NOT NULL,
    facility_id character varying(255) NOT NULL,
    is_bookable boolean DEFAULT false NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL COLLATE public.en_numeric,
    facility_id character varying(255),
    visibility_status text DEFAULT 'current'::text,
    location_group_id character varying(255),
    max_occupancy integer,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: scheduled_vaccines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_vaccines (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    category character varying(255),
    label character varying(255),
    dose_label character varying(255),
    weeks_from_birth_due integer,
    index integer,
    vaccine_id character varying(255),
    weeks_from_last_vaccination_due integer,
    visibility_status text DEFAULT 'current'::text,
    hide_from_certificate boolean DEFAULT false NOT NULL,
    sort_index integer DEFAULT 0 NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    key text NOT NULL,
    value jsonb,
    facility_id character varying(255),
    scope text DEFAULT 'global'::text NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: upcoming_vaccinations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.upcoming_vaccinations AS
 WITH vaccine_settings AS (
         SELECT s.value AS thresholds,
            1 AS priority
           FROM public.settings s
          WHERE ((s.deleted_at IS NULL) AND (s.key = 'upcomingVaccinations.thresholds'::text))
        UNION
         SELECT '[{"status": "SCHEDULED", "threshold": 28}, {"status": "UPCOMING", "threshold": 7}, {"status": "DUE", "threshold": -7}, {"status": "OVERDUE", "threshold": -55}, {"status": "MISSED", "threshold": "-Infinity"}]'::jsonb,
            0
  ORDER BY 2 DESC
 LIMIT 1
        ), vaccine_thresholds AS (
         SELECT ((jsonb_array_elements(s.thresholds) ->> 'threshold'::text))::double precision AS threshold,
            (jsonb_array_elements(s.thresholds) ->> 'status'::text) AS status
           FROM vaccine_settings s
        ), vaccine_agelimit_settings AS (
         SELECT s.value AS age_limit,
            1 AS priority
           FROM public.settings s
          WHERE ((s.deleted_at IS NULL) AND (s.key = 'upcomingVaccinations.ageLimit'::text))
        UNION
         SELECT '15'::jsonb,
            0
  ORDER BY 2 DESC
 LIMIT 1
        ), vaccine_agelimit AS (
         SELECT (CURRENT_DATE - (((s.age_limit)::text)::integer * 365)) AS date
           FROM vaccine_agelimit_settings s
        ), filtered_patients AS (
         SELECT p.id AS patient_id,
            (p.date_of_birth)::date AS date_of_birth
           FROM public.patients p
          WHERE ((p.deleted_at IS NULL) AND ((p.visibility_status)::text = 'current'::text) AND ((p.date_of_birth)::date > ( SELECT vaccine_agelimit.date
                   FROM vaccine_agelimit)))
        ), filtered_scheduled_vaccines AS (
         SELECT sv.id AS scheduled_vaccine_id,
            sv.category AS vaccine_category,
            sv.vaccine_id,
            sv.index,
            sv.weeks_from_birth_due,
            sv.weeks_from_last_vaccination_due
           FROM public.scheduled_vaccines sv
          WHERE ((sv.deleted_at IS NULL) AND (sv.visibility_status = 'current'::text))
        ), filtered_administered_vaccines AS (
         SELECT e.patient_id,
            av.scheduled_vaccine_id,
            (av.date)::date AS administered_date
           FROM ((public.administered_vaccines av
             JOIN public.scheduled_vaccines sv ON (((sv.id)::text = (av.scheduled_vaccine_id)::text)))
             JOIN public.encounters e ON (((e.id)::text = (av.encounter_id)::text)))
          WHERE ((av.deleted_at IS NULL) AND ((av.status)::text = 'GIVEN'::text) AND (e.deleted_at IS NULL))
        ), latest_administered_vaccines AS (
         SELECT DISTINCT ON (e.patient_id, sv.vaccine_category, sv.vaccine_id) av.id,
            e.patient_id,
            av.scheduled_vaccine_id,
            (av.date)::date AS administered_date,
            sv.vaccine_category,
            sv.vaccine_id,
            sv.index
           FROM ((public.administered_vaccines av
             JOIN filtered_scheduled_vaccines sv ON (((sv.scheduled_vaccine_id)::text = (av.scheduled_vaccine_id)::text)))
             JOIN public.encounters e ON (((e.id)::text = (av.encounter_id)::text)))
          WHERE ((av.deleted_at IS NULL) AND ((av.status)::text = 'GIVEN'::text) AND (e.deleted_at IS NULL))
          ORDER BY e.patient_id, sv.vaccine_category, sv.vaccine_id, sv.index DESC
        ), patient_vaccine_fixed_schedule AS (
         SELECT fp.patient_id,
            fsv.scheduled_vaccine_id,
            fsv.vaccine_category,
            fsv.vaccine_id,
            (fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) AS due_date
           FROM ((filtered_patients fp
             CROSS JOIN filtered_scheduled_vaccines fsv)
             LEFT JOIN filtered_administered_vaccines fav ON ((((fav.patient_id)::text = (fp.patient_id)::text) AND ((fav.scheduled_vaccine_id)::text = (fsv.scheduled_vaccine_id)::text))))
          WHERE ((fav.scheduled_vaccine_id IS NULL) AND (fsv.weeks_from_birth_due IS NOT NULL) AND (fsv.weeks_from_last_vaccination_due IS NULL) AND (((fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) >= (CURRENT_DATE - 180)) AND ((fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) <= (CURRENT_DATE + 730))))
        ), patient_vaccine_dynamic_schedule AS (
         SELECT DISTINCT ON (fp.patient_id, upcoming_scheduled_vaccine.vaccine_category, upcoming_scheduled_vaccine.vaccine_id) fp.patient_id,
            upcoming_scheduled_vaccine.scheduled_vaccine_id,
            upcoming_scheduled_vaccine.vaccine_category,
            upcoming_scheduled_vaccine.vaccine_id,
            ((upcoming_scheduled_vaccine.weeks_from_last_vaccination_due * 7) + fav.administered_date) AS due_date
           FROM ((((latest_administered_vaccines fav
             JOIN filtered_patients fp ON (((fp.patient_id)::text = (fav.patient_id)::text)))
             JOIN filtered_scheduled_vaccines latest_scheduled_vaccines ON (((latest_scheduled_vaccines.scheduled_vaccine_id)::text = (fav.scheduled_vaccine_id)::text)))
             JOIN filtered_scheduled_vaccines upcoming_scheduled_vaccine ON ((((latest_scheduled_vaccines.vaccine_id)::text = (upcoming_scheduled_vaccine.vaccine_id)::text) AND ((latest_scheduled_vaccines.vaccine_category)::text = (upcoming_scheduled_vaccine.vaccine_category)::text) AND (upcoming_scheduled_vaccine.weeks_from_birth_due IS NULL) AND (upcoming_scheduled_vaccine.weeks_from_last_vaccination_due IS NOT NULL) AND (upcoming_scheduled_vaccine.index > latest_scheduled_vaccines.index))))
             LEFT JOIN filtered_administered_vaccines upcoming_administered_vaccines ON ((((upcoming_administered_vaccines.patient_id)::text = (fp.patient_id)::text) AND ((upcoming_administered_vaccines.scheduled_vaccine_id)::text = (upcoming_scheduled_vaccine.scheduled_vaccine_id)::text))))
          WHERE (upcoming_administered_vaccines.scheduled_vaccine_id IS NULL)
          ORDER BY fp.patient_id, upcoming_scheduled_vaccine.vaccine_category, upcoming_scheduled_vaccine.vaccine_id, upcoming_scheduled_vaccine.index
        ), patient_vaccine_schedule AS (
         SELECT patient_vaccine_fixed_schedule.patient_id,
            patient_vaccine_fixed_schedule.scheduled_vaccine_id,
            patient_vaccine_fixed_schedule.vaccine_category,
            patient_vaccine_fixed_schedule.vaccine_id,
            patient_vaccine_fixed_schedule.due_date
           FROM patient_vaccine_fixed_schedule
        UNION ALL
         SELECT patient_vaccine_dynamic_schedule.patient_id,
            patient_vaccine_dynamic_schedule.scheduled_vaccine_id,
            patient_vaccine_dynamic_schedule.vaccine_category,
            patient_vaccine_dynamic_schedule.vaccine_id,
            patient_vaccine_dynamic_schedule.due_date
           FROM patient_vaccine_dynamic_schedule
          WHERE ((patient_vaccine_dynamic_schedule.due_date >= (CURRENT_DATE - 180)) AND (patient_vaccine_dynamic_schedule.due_date <= (CURRENT_DATE + 730)))
        )
 SELECT pvs.patient_id,
    pvs.scheduled_vaccine_id,
    pvs.vaccine_category,
    pvs.vaccine_id,
    pvs.due_date,
    (pvs.due_date - CURRENT_DATE) AS days_till_due,
    ( SELECT vst.status
           FROM vaccine_thresholds vst
          WHERE (((pvs.due_date - CURRENT_DATE))::double precision > vst.threshold)
          ORDER BY vst.threshold DESC
         LIMIT 1) AS status
   FROM patient_vaccine_schedule pvs;


--
-- Name: materialized_upcoming_vaccinations; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.materialized_upcoming_vaccinations AS
 SELECT upcoming_vaccinations.patient_id,
    upcoming_vaccinations.scheduled_vaccine_id,
    upcoming_vaccinations.vaccine_category,
    upcoming_vaccinations.vaccine_id,
    upcoming_vaccinations.due_date,
    upcoming_vaccinations.days_till_due,
    upcoming_vaccinations.status
   FROM public.upcoming_vaccinations
  WITH NO DATA;


--
-- Name: medication_administration_record_doses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medication_administration_record_doses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dose_amount numeric NOT NULL,
    given_time public.date_time_string NOT NULL,
    given_by_user_id character varying(255) NOT NULL,
    recorded_by_user_id character varying(255) NOT NULL,
    mar_id character varying(255) NOT NULL,
    dose_index integer NOT NULL,
    is_removed boolean,
    reason_for_removal character varying(255),
    reason_for_change character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: medication_administration_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medication_administration_records (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    status character varying(255),
    due_at public.date_time_string NOT NULL,
    recorded_at public.date_time_string,
    recorded_by_user_id character varying(255),
    prescription_id character varying(255),
    is_auto_generated boolean DEFAULT false NOT NULL,
    changing_status_reason text,
    changing_not_given_info_reason character varying(255),
    reason_not_given_id character varying(255),
    is_error boolean,
    error_notes text,
    is_edited boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: note_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note_page_id uuid NOT NULL,
    revised_by_id character varying(255),
    author_id character varying(255),
    on_behalf_of_id character varying(255),
    content text DEFAULT ''::text NOT NULL,
    date public.date_time_string NOT NULL,
    date_legacy timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: note_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note_type character varying(255) NOT NULL,
    record_id character varying(255) NOT NULL,
    record_type character varying(255) NOT NULL,
    date public.date_time_string NOT NULL,
    date_legacy timestamp with time zone,
    visibility_status text DEFAULT 'current'::text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note_type character varying(255) NOT NULL,
    record_id character varying(255) NOT NULL,
    record_type character varying(255) NOT NULL,
    date public.date_time_string NOT NULL,
    date_legacy timestamp with time zone,
    visibility_status text DEFAULT 'current'::text,
    author_id character varying(255),
    on_behalf_of_id character varying(255),
    content text DEFAULT ''::text NOT NULL,
    revised_by_id uuid,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: notes_legacy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes_legacy (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    record_id character varying(255) NOT NULL,
    record_type character varying(255) NOT NULL,
    date timestamp with time zone NOT NULL,
    note_type character varying(255),
    content text DEFAULT ''::text NOT NULL,
    author_id character varying(255),
    on_behalf_of_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    created_time public.date_time_string NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    patient_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: one_time_logins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.one_time_logins (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: patient_additional_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_additional_data (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    place_of_birth character varying(255),
    primary_contact_number character varying(255),
    secondary_contact_number character varying(255),
    marital_status character varying(255),
    city_town character varying(255),
    street_village character varying(255),
    educational_level character varying(255),
    social_media character varying(255),
    blood_type character varying(255),
    title character varying(255),
    ethnicity_id character varying(255),
    nationality_id character varying(255),
    country_id character varying(255),
    division_id character varying(255),
    subdivision_id character varying(255),
    medical_area_id character varying(255),
    nursing_zone_id character varying(255),
    settlement_id character varying(255),
    occupation_id character varying(255),
    patient_id character varying(255) NOT NULL,
    birth_certificate character varying(255),
    driving_license character varying(255),
    passport character varying(255),
    religion_id character varying(255),
    patient_billing_type_id character varying(255),
    country_of_birth_id character varying(255),
    registered_by_id character varying(255),
    emergency_contact_name character varying(255) DEFAULT ''::character varying,
    emergency_contact_number character varying(255) DEFAULT ''::character varying,
    mother_id character varying(255),
    father_id character varying(255),
    id text GENERATED ALWAYS AS (patient_id) STORED,
    updated_at_by_field json,
    health_center_id text,
    insurer_id character varying(255),
    insurer_policy_number character varying(255),
    secondary_village_id text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_allergies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_allergies (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note character varying(255),
    recorded_date public.date_time_string NOT NULL,
    patient_id character varying(255),
    practitioner_id character varying(255),
    allergy_id character varying(255),
    recorded_date_legacy timestamp with time zone,
    reaction_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_birth_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_birth_data (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    patient_id character varying(255) NOT NULL,
    birth_weight numeric,
    birth_length numeric,
    birth_delivery_type character varying(255),
    gestational_age_estimate double precision,
    apgar_score_one_minute integer,
    apgar_score_five_minutes integer,
    apgar_score_ten_minutes integer,
    time_of_birth public.date_time_string,
    birth_type character varying(255),
    attendant_at_birth character varying(255),
    name_of_attendant_at_birth character varying(255),
    birth_facility_id character varying(255),
    registered_birth_place character varying(255),
    time_of_birth_legacy character varying(255),
    id text GENERATED ALWAYS AS (patient_id) STORED,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_care_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_care_plans (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_time_string NOT NULL,
    patient_id character varying(255),
    examiner_id character varying(255),
    care_plan_id character varying(255),
    date_legacy timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_communications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_communications (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    type text NOT NULL,
    channel text NOT NULL,
    subject text,
    content text,
    status public.enum_patient_communications_status DEFAULT 'Queued'::public.enum_patient_communications_status NOT NULL,
    error text,
    retry_count integer,
    patient_id character varying(255),
    destination character varying(255) DEFAULT NULL::character varying,
    attachment character varying(255) DEFAULT NULL::character varying,
    hash integer,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_conditions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note character varying(255),
    recorded_date public.date_time_string NOT NULL,
    resolved boolean DEFAULT false,
    patient_id character varying(255),
    examiner_id character varying(255),
    condition_id character varying(255),
    recorded_date_legacy timestamp with time zone,
    resolution_date public.date_time_string,
    resolution_practitioner_id character varying(255),
    resolution_note text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_contacts (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    method text NOT NULL,
    connection_details jsonb,
    patient_id character varying(255) NOT NULL,
    relationship_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_death_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_death_data (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(255) NOT NULL,
    clinician_id character varying(255) NOT NULL,
    facility_id character varying(255),
    manner character varying(255),
    recent_surgery character varying(255),
    last_surgery_date public.date_string,
    last_surgery_reason_id character varying(255),
    external_cause_date public.date_string,
    external_cause_location character varying(255),
    external_cause_notes text,
    was_pregnant character varying(255),
    pregnancy_contributed character varying(255),
    fetal_or_infant boolean,
    stillborn character varying(255),
    birth_weight integer,
    within_day_of_birth boolean,
    hours_survived_since_birth integer,
    carrier_age integer,
    carrier_pregnancy_weeks integer,
    carrier_existing_condition_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    outside_health_facility boolean,
    primary_cause_time_after_onset integer,
    primary_cause_condition_id character varying(255),
    antecedent_cause1_time_after_onset integer,
    antecedent_cause1_condition_id character varying(255),
    antecedent_cause2_time_after_onset integer,
    antecedent_cause2_condition_id character varying(255),
    external_cause_date_legacy timestamp with time zone,
    last_surgery_date_legacy timestamp with time zone,
    is_final boolean DEFAULT false NOT NULL,
    visibility_status text DEFAULT 'current'::text,
    antecedent_cause3_time_after_onset integer,
    antecedent_cause3_condition_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_facilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_facilities (
    id text GENERATED ALWAYS AS (((replace((patient_id)::text, ';'::text, ':'::text) || ';'::text) || replace((facility_id)::text, ';'::text, ':'::text))) STORED,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    facility_id character varying(255) NOT NULL,
    patient_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0
);


--
-- Name: patient_family_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_family_histories (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note character varying(255),
    recorded_date public.date_time_string NOT NULL,
    relationship character varying(255),
    patient_id character varying(255),
    practitioner_id character varying(255),
    diagnosis_id character varying(255),
    recorded_date_legacy timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_field_definition_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_field_definition_categories (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_field_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_field_definitions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(255) NOT NULL,
    field_type character varying(255) NOT NULL,
    options character varying(255)[],
    visibility_status character varying(255) DEFAULT 'current'::character varying NOT NULL,
    category_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_field_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_field_values (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    value text NOT NULL,
    definition_id character varying(255) NOT NULL,
    patient_id character varying(255) NOT NULL,
    id text GENERATED ALWAYS AS (((replace((patient_id)::text, ';'::text, ':'::text) || ';'::text) || replace((definition_id)::text, ';'::text, ':'::text))) STORED,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_issues (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    note character varying(255),
    recorded_date public.date_time_string NOT NULL,
    type public.enum_patient_issues_type DEFAULT 'issue'::public.enum_patient_issues_type NOT NULL,
    patient_id character varying(255),
    recorded_date_legacy timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_ongoing_prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_ongoing_prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(255) NOT NULL,
    prescription_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_program_registration_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_program_registration_conditions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_time_string NOT NULL,
    deletion_date public.date_time_string,
    program_registry_condition_id character varying(255),
    clinician_id character varying(255),
    deletion_clinician_id character varying(255),
    reason_for_change character varying(255),
    patient_program_registration_id text,
    program_registry_condition_category_id text NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_program_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_program_registrations (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_time_string NOT NULL,
    registration_status text NOT NULL,
    patient_id character varying(255) NOT NULL,
    program_registry_id character varying(255) NOT NULL,
    clinical_status_id character varying(255),
    clinician_id character varying(255) NOT NULL,
    registering_facility_id character varying(255),
    facility_id character varying(255),
    village_id character varying(255),
    deactivated_clinician_id character varying(255),
    deactivated_date character varying(255),
    id text GENERATED ALWAYS AS (((replace((patient_id)::text, ';'::text, ':'::text) || ';'::text) || replace((program_registry_id)::text, ';'::text, ':'::text))) STORED NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_secondary_ids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_secondary_ids (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    value character varying(255) NOT NULL,
    visibility_status text NOT NULL,
    type_id character varying(255) NOT NULL,
    patient_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: patient_vrs_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_vrs_data (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    id_type character varying(255),
    identifier character varying(255),
    unmatched_village_name character varying(255),
    patient_id character varying(255),
    is_deleted_by_remote boolean DEFAULT false NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    role_id character varying(255) NOT NULL,
    noun character varying(255) NOT NULL,
    verb character varying(255) NOT NULL,
    object_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: pharmacy_order_prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pharmacy_order_prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacy_order_id uuid NOT NULL,
    prescription_id text NOT NULL,
    quantity integer NOT NULL,
    repeats integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: pharmacy_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pharmacy_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ordering_clinician_id text NOT NULL,
    encounter_id text NOT NULL,
    comments text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_discharge_prescription boolean DEFAULT false NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: portal_one_time_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_one_time_tokens (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    portal_user_id text NOT NULL,
    type character varying(255) DEFAULT 'login'::character varying NOT NULL,
    token character varying(255) NOT NULL,
    expires_at public.date_time_string NOT NULL
);


--
-- Name: portal_survey_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_survey_assignments (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    deleted_at timestamp with time zone,
    patient_id text NOT NULL,
    survey_id text NOT NULL,
    status text DEFAULT 'outstanding'::text NOT NULL,
    assigned_at public.date_time_string NOT NULL,
    assigned_by_id text NOT NULL,
    survey_response_id text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: portal_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_users (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    deleted_at timestamp with time zone,
    patient_id text NOT NULL,
    email text NOT NULL,
    visibility_status text DEFAULT 'current'::text,
    status text DEFAULT 'pending'::text NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_time_string NOT NULL,
    end_date public.date_time_string,
    notes character varying(255),
    indication character varying(255),
    route character varying(255),
    medication_id character varying(255),
    prescriber_id character varying(255),
    quantity integer,
    discontinued boolean,
    discontinuing_clinician_id character varying(255),
    discontinuing_reason character varying(255),
    repeats integer,
    discontinued_date character varying(255),
    date_legacy timestamp with time zone,
    end_date_legacy timestamp with time zone,
    is_ongoing boolean,
    is_prn boolean,
    is_variable_dose boolean,
    dose_amount numeric,
    units character varying(255) DEFAULT ''::character varying NOT NULL,
    frequency character varying(255) DEFAULT ''::character varying NOT NULL,
    start_date public.date_time_string NOT NULL,
    duration_value numeric,
    duration_unit character varying(255),
    is_phone_order boolean,
    ideal_times character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    pharmacy_notes character varying(255),
    display_pharmacy_notes_in_mar boolean,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: procedure_assistant_clinicians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_assistant_clinicians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    procedure_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: procedure_survey_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_survey_responses (
    id uuid NOT NULL,
    procedure_id character varying(255) NOT NULL,
    survey_response_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: procedure_type_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_type_surveys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    procedure_type_id character varying(255) NOT NULL,
    survey_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedures (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    completed boolean DEFAULT false,
    date public.date_time_string NOT NULL,
    end_time public.date_time_string,
    note text,
    completed_note text,
    encounter_id character varying(255),
    location_id character varying(255),
    procedure_type_id character varying(255),
    anaesthetic_id character varying(255),
    physician_id character varying(255),
    anaesthetist_id character varying(255),
    start_time public.date_time_string,
    date_legacy timestamp with time zone,
    start_time_legacy character varying(255),
    end_time_legacy timestamp with time zone,
    department_id character varying(255),
    assistant_anaesthetist_id character varying(255),
    time_in public.date_time_string,
    time_out public.date_time_string,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: program_data_elements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_data_elements (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    code character varying(255),
    name character varying(255),
    indicator character varying(255),
    default_text character varying(255),
    default_options text,
    type character varying(31) NOT NULL,
    visualisation_config text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: program_registries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_registries (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL,
    name text NOT NULL,
    currently_at_type text NOT NULL,
    visibility_status text DEFAULT 'current'::text,
    program_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: program_registry_clinical_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_registry_clinical_statuses (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL,
    name text NOT NULL,
    color text,
    visibility_status text DEFAULT 'current'::text,
    program_registry_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: program_registry_condition_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_registry_condition_categories (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL,
    name text NOT NULL,
    visibility_status text DEFAULT 'current'::text,
    program_registry_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: program_registry_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_registry_conditions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL,
    name text NOT NULL,
    visibility_status text DEFAULT 'current'::text,
    program_registry_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    code character varying(255),
    name character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: reference_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_data (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    code character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    name text NOT NULL,
    visibility_status text DEFAULT 'current'::text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: reference_data_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_data_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    reference_data_id text,
    reference_data_parent_id text,
    type character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: reference_drugs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_drugs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference_data_id character varying(255) NOT NULL,
    route character varying(255),
    units character varying(255),
    notes character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_sensitive boolean DEFAULT false NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: reference_medication_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_medication_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference_data_id character varying(255) NOT NULL,
    medication_id character varying(255) NOT NULL,
    is_variable_dose boolean DEFAULT false NOT NULL,
    is_prn boolean DEFAULT false NOT NULL,
    dose_amount numeric,
    units character varying(255) NOT NULL,
    frequency character varying(255) NOT NULL,
    route character varying(255) NOT NULL,
    duration_value numeric,
    duration_unit character varying(255),
    notes text,
    discharge_quantity integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_ongoing boolean DEFAULT false NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    referred_facility character varying(255),
    initiating_encounter_id character varying(255),
    completing_encounter_id character varying(255),
    survey_response_id character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    refresh_id text NOT NULL,
    device_id text NOT NULL,
    user_id character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: report_definition_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_definition_versions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    version_number integer NOT NULL,
    notes text,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    query text,
    query_options json,
    report_definition_id character varying(255),
    user_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: report_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_definitions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    name character varying(255) NOT NULL,
    db_schema character varying(255) DEFAULT 'reporting'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: report_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_requests (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    report_type character varying(255),
    recipients text NOT NULL,
    parameters text,
    status character varying(31) NOT NULL,
    requested_by_user_id character varying(255) NOT NULL,
    error text,
    process_started_time timestamp with time zone,
    facility_id character varying(255),
    export_format character varying(255) DEFAULT 'xlsx'::character varying NOT NULL,
    report_definition_version_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    name character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: signers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signers (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    country_code character varying(255) NOT NULL,
    private_key bytea,
    public_key bytea NOT NULL,
    request text NOT NULL,
    certificate text,
    validity_period_start timestamp with time zone,
    validity_period_end timestamp with time zone,
    signatures_issued integer DEFAULT 0 NOT NULL,
    request_sent_at timestamp with time zone,
    working_period_start timestamp with time zone,
    working_period_end timestamp with time zone
);


--
-- Name: socket_io_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socket_io_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    payload bytea,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: survey_response_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.survey_response_answers (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(255),
    body text,
    response_id character varying(255),
    data_element_id character varying(255),
    body_legacy text,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.survey_responses (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    start_time public.date_time_string,
    end_time public.date_time_string,
    result double precision,
    survey_id character varying(255),
    encounter_id character varying(255),
    result_text text,
    user_id character varying(255),
    start_time_legacy timestamp with time zone,
    end_time_legacy timestamp with time zone,
    notified boolean,
    metadata jsonb,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: survey_screen_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.survey_screen_components (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    screen_index integer,
    component_index integer,
    text character varying(255),
    visibility_criteria character varying(255),
    validation_criteria text,
    detail character varying(255),
    config character varying(255),
    options character varying(255),
    calculation character varying(255),
    survey_id character varying(255),
    data_element_id character varying(255),
    visibility_status character varying(255) DEFAULT 'current'::character varying,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surveys (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    code character varying(255),
    name character varying(255),
    program_id character varying(255),
    survey_type character varying(255) DEFAULT 'programs'::character varying,
    is_sensitive boolean DEFAULT false NOT NULL,
    visibility_status character varying(255) DEFAULT 'current'::character varying NOT NULL,
    notifiable boolean DEFAULT false NOT NULL,
    notify_email_addresses character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[] NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: sync_device_ticks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_device_ticks (
    id bigint GENERATED ALWAYS AS (persisted_at_sync_tick) STORED,
    persisted_at_sync_tick bigint NOT NULL,
    device_id text NOT NULL
);


--
-- Name: sync_lookup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_lookup (
    id bigint NOT NULL,
    record_id character varying(255) NOT NULL,
    record_type character varying(255) NOT NULL,
    data json NOT NULL,
    updated_at_sync_tick bigint NOT NULL,
    patient_id character varying(255),
    encounter_id character varying(255),
    facility_id character varying(255),
    is_lab_request boolean NOT NULL,
    is_deleted boolean NOT NULL,
    updated_at_by_field_sum bigint,
    pushed_by_device_id text
);


--
-- Name: sync_lookup_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_lookup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sync_lookup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_lookup_id_seq OWNED BY public.sync_lookup.id;


--
-- Name: sync_lookup_ticks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_lookup_ticks (
    id bigint GENERATED ALWAYS AS (lookup_end_tick) STORED,
    source_start_tick bigint NOT NULL,
    lookup_end_tick bigint NOT NULL
);


--
-- Name: sync_queued_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_queued_devices (
    id text NOT NULL,
    last_seen_time timestamp with time zone NOT NULL,
    facility_id_legacy text,
    last_synced_tick bigint NOT NULL,
    urgent boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    facility_ids jsonb NOT NULL
);


--
-- Name: sync_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    start_time timestamp with time zone NOT NULL,
    last_connection_time timestamp with time zone NOT NULL,
    snapshot_completed_at timestamp with time zone,
    debug_info json,
    completed_at timestamp with time zone,
    persist_completed_at timestamp with time zone,
    pull_since bigint,
    pull_until bigint,
    started_at_tick bigint,
    snapshot_started_at timestamp with time zone,
    errors text[],
    parameters jsonb DEFAULT '"{}"'::jsonb NOT NULL
);


--
-- Name: task_designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_designations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    designation_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: task_template_designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_template_designations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_template_id uuid NOT NULL,
    designation_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference_data_id character varying(255) NOT NULL,
    high_priority boolean,
    frequency_value numeric,
    frequency_unit character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id character varying(255) NOT NULL,
    name text NOT NULL,
    due_time public.date_time_string NOT NULL,
    end_time public.date_time_string,
    requested_by_user_id character varying(255) NOT NULL,
    request_time public.date_time_string NOT NULL,
    status character varying(255) DEFAULT 'todo'::character varying NOT NULL,
    note text,
    frequency_value numeric,
    frequency_unit character varying(255),
    high_priority boolean,
    parent_task_id uuid,
    completed_by_user_id character varying(255),
    completed_time public.date_time_string,
    completed_note text,
    not_completed_by_user_id character varying(255),
    not_completed_time public.date_time_string,
    not_completed_reason_id text,
    todo_by_user_id character varying(255),
    todo_time public.date_time_string,
    todo_note text,
    deleted_by_user_id character varying(255),
    deleted_time public.date_time_string,
    deleted_reason_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_reason_for_sync_id character varying(255),
    duration_value numeric,
    duration_unit character varying(255),
    task_type character varying(255) DEFAULT 'normal_task'::character varying NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3),
    name text NOT NULL,
    date_created public.date_string,
    title text,
    body text,
    visibility_status text DEFAULT 'current'::text,
    created_by_id character varying(255),
    type text NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: translated_strings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translated_strings (
    id text GENERATED ALWAYS AS (((string_id || ';'::text) || language)) STORED,
    string_id text NOT NULL,
    language text NOT NULL,
    text text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: triages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triages (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    arrival_time public.date_time_string,
    triage_time public.date_time_string,
    closed_time public.date_time_string,
    score text,
    encounter_id character varying(255),
    practitioner_id character varying(255),
    chief_complaint_id character varying(255),
    secondary_complaint_id character varying(255),
    arrival_time_legacy timestamp with time zone,
    triage_time_legacy timestamp with time zone,
    closed_time_legacy timestamp with time zone,
    arrival_mode_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: user_designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_designations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    designation_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: user_facilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_facilities (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    facility_id character varying(255),
    user_id character varying(255),
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: user_localisation_caches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_localisation_caches (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    localisation text NOT NULL,
    user_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    user_id character varying(255) NOT NULL,
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    facility_id character varying(255),
    id text GENERATED ALWAYS AS ((((((user_id)::text || ';'::text) || (key)::text) || ';'::text) || (COALESCE(facility_id, ''::character varying))::text)) STORED NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: user_recently_viewed_patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_recently_viewed_patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    user_id character varying(255) NOT NULL,
    patient_id character varying(255) NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    email character varying(255) NOT NULL,
    password character varying(255),
    display_name character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'practitioner'::character varying NOT NULL,
    display_id character varying(255),
    visibility_status character varying(255) DEFAULT 'current'::character varying NOT NULL,
    phone_number character varying(255),
    device_registration_quota integer DEFAULT 0 NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: vital_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vital_logs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    date public.date_time_string NOT NULL,
    previous_value text,
    new_value text,
    reason_for_change text,
    recorded_by_id character varying(255),
    answer_id character varying(255) NOT NULL,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: vitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitals (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    date_recorded public.date_time_string NOT NULL,
    temperature double precision,
    weight double precision,
    height double precision,
    sbp double precision,
    dbp double precision,
    heart_rate double precision,
    respiratory_rate double precision,
    spo2 double precision,
    avpu public.enum_vitals_avpu,
    encounter_id character varying(255),
    gcs double precision,
    hemoglobin double precision,
    fasting_blood_glucose double precision,
    urine_ph double precision,
    urine_leukocytes character varying(255),
    urine_nitrites character varying(255),
    urobilinogen double precision,
    urine_protein character varying(255),
    blood_in_urine character varying(255),
    urine_specific_gravity double precision,
    urine_ketone character varying(255),
    urine_bilirubin character varying(255),
    urine_glucose double precision,
    date_recorded_legacy timestamp with time zone,
    migrated_record character varying(255) DEFAULT NULL::character varying,
    updated_at_sync_tick bigint DEFAULT 0 NOT NULL
);


--
-- Name: sync_lookup id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_lookup ALTER COLUMN id SET DEFAULT nextval('public.sync_lookup_id_seq'::regclass);


--
-- Name: encounters encounters_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (id);


--
-- Name: immunizations immunizations_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.immunizations
    ADD CONSTRAINT immunizations_pkey PRIMARY KEY (id);


--
-- Name: job_workers job_workers_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.job_workers
    ADD CONSTRAINT job_workers_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_discriminant_key; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.jobs
    ADD CONSTRAINT jobs_discriminant_key UNIQUE (discriminant);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: medication_requests medication_requests_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.medication_requests
    ADD CONSTRAINT medication_requests_pkey PRIMARY KEY (id);


--
-- Name: medication_requests medication_requests_upstream_id_key; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.medication_requests
    ADD CONSTRAINT medication_requests_upstream_id_key UNIQUE (upstream_id);


--
-- Name: non_fhir_medici_report non_fhir_medici_report_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.non_fhir_medici_report
    ADD CONSTRAINT non_fhir_medici_report_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: practitioners practitioners_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.practitioners
    ADD CONSTRAINT practitioners_pkey PRIMARY KEY (id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: specimens specimens_pkey; Type: CONSTRAINT; Schema: fhir; Owner: -
--

ALTER TABLE ONLY fhir.specimens
    ADD CONSTRAINT specimens_pkey PRIMARY KEY (id);


--
-- Name: accesses accesses_pkey; Type: CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.accesses
    ADD CONSTRAINT accesses_pkey PRIMARY KEY (id);


--
-- Name: changes changes_pkey; Type: CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.changes
    ADD CONSTRAINT changes_pkey PRIMARY KEY (id);


--
-- Name: debug_logs debug_logs_pkey; Type: CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.debug_logs
    ADD CONSTRAINT debug_logs_pkey PRIMARY KEY (id);


--
-- Name: fhir_writes fhir_writes_pkey; Type: CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.fhir_writes
    ADD CONSTRAINT fhir_writes_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: administered_vaccines administered_vaccines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_pkey PRIMARY KEY (id);


--
-- Name: appointment_schedules appointment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_schedules
    ADD CONSTRAINT appointment_schedules_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: certifiable_vaccines certifiable_vaccines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifiable_vaccines
    ADD CONSTRAINT certifiable_vaccines_pkey PRIMARY KEY (id);


--
-- Name: certifiable_vaccines certifiable_vaccines_unique_vaccine_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifiable_vaccines
    ADD CONSTRAINT certifiable_vaccines_unique_vaccine_id UNIQUE (vaccine_id);


--
-- Name: certificate_notifications certificate_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_notifications
    ADD CONSTRAINT certificate_notifications_pkey PRIMARY KEY (id);


--
-- Name: contributing_death_causes death_causes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributing_death_causes
    ADD CONSTRAINT death_causes_pkey PRIMARY KEY (id);


--
-- Name: death_revert_logs death_revert_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.death_revert_logs
    ADD CONSTRAINT death_revert_logs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: discharges discharges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discharges
    ADD CONSTRAINT discharges_pkey PRIMARY KEY (id);


--
-- Name: document_metadata document_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT document_metadata_pkey PRIMARY KEY (id);


--
-- Name: encounter_diagnoses encounter_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_pkey PRIMARY KEY (id);


--
-- Name: encounter_diets encounter_diets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diets
    ADD CONSTRAINT encounter_diets_pkey PRIMARY KEY (id);


--
-- Name: encounter_history encounter_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_history
    ADD CONSTRAINT encounter_history_pkey PRIMARY KEY (id);


--
-- Name: prescriptions encounter_medications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT encounter_medications_pkey PRIMARY KEY (id);


--
-- Name: encounter_pause_prescription_histories encounter_pause_prescription_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescription_histories
    ADD CONSTRAINT encounter_pause_prescription_histories_pkey PRIMARY KEY (id);


--
-- Name: encounter_pause_prescriptions encounter_pause_prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescriptions
    ADD CONSTRAINT encounter_pause_prescriptions_pkey PRIMARY KEY (id);


--
-- Name: encounter_prescriptions encounter_prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_prescriptions
    ADD CONSTRAINT encounter_prescriptions_pkey PRIMARY KEY (id);


--
-- Name: encounters encounters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (id);


--
-- Name: imaging_area_external_codes imaging_area_external_codes_area_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_area_external_codes
    ADD CONSTRAINT imaging_area_external_codes_area_id_key UNIQUE (area_id);


--
-- Name: imaging_area_external_codes imaging_area_external_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_area_external_codes
    ADD CONSTRAINT imaging_area_external_codes_pkey PRIMARY KEY (id);


--
-- Name: imaging_request_areas imaging_request_area_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_request_areas
    ADD CONSTRAINT imaging_request_area_pkey PRIMARY KEY (id);


--
-- Name: imaging_requests imaging_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_requests
    ADD CONSTRAINT imaging_requests_pkey PRIMARY KEY (id);


--
-- Name: imaging_results imaging_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_pkey PRIMARY KEY (id);


--
-- Name: invoice_discounts invoice_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_discounts
    ADD CONSTRAINT invoice_discounts_pkey PRIMARY KEY (id);


--
-- Name: invoice_insurer_payments invoice_insurer_payments_invoice_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_insurer_payments
    ADD CONSTRAINT invoice_insurer_payments_invoice_payment_id_key UNIQUE (invoice_payment_id);


--
-- Name: invoice_insurer_payments invoice_insurer_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_insurer_payments
    ADD CONSTRAINT invoice_insurer_payments_pkey PRIMARY KEY (id);


--
-- Name: invoice_insurers invoice_insurers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_insurers
    ADD CONSTRAINT invoice_insurers_pkey PRIMARY KEY (id);


--
-- Name: invoice_item_discounts invoice_item_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_item_discounts
    ADD CONSTRAINT invoice_item_discounts_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_patient_payments invoice_patient_payments_invoice_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_patient_payments
    ADD CONSTRAINT invoice_patient_payments_invoice_payment_id_key UNIQUE (invoice_payment_id);


--
-- Name: invoice_patient_payments invoice_patient_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_patient_payments
    ADD CONSTRAINT invoice_patient_payments_pkey PRIMARY KEY (id);


--
-- Name: invoice_payments invoice_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);


--
-- Name: invoice_products invoice_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_products
    ADD CONSTRAINT invoice_products_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: ips_requests ips_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ips_requests
    ADD CONSTRAINT ips_requests_pkey PRIMARY KEY (id);


--
-- Name: lab_request_attachments lab_request_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_request_attachments
    ADD CONSTRAINT lab_request_attachments_pkey PRIMARY KEY (id);


--
-- Name: lab_request_logs lab_request_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_request_logs
    ADD CONSTRAINT lab_request_logs_pkey PRIMARY KEY (id);


--
-- Name: lab_requests lab_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_pkey PRIMARY KEY (id);


--
-- Name: lab_test_panel_lab_test_types lab_test_panel_lab_test_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panel_lab_test_types
    ADD CONSTRAINT lab_test_panel_lab_test_types_pkey PRIMARY KEY (lab_test_panel_id, lab_test_type_id);


--
-- Name: lab_test_panel_requests lab_test_panel_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panel_requests
    ADD CONSTRAINT lab_test_panel_requests_pkey PRIMARY KEY (id);


--
-- Name: lab_test_panels lab_test_panels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panels
    ADD CONSTRAINT lab_test_panels_pkey PRIMARY KEY (id);


--
-- Name: lab_test_types lab_test_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_types
    ADD CONSTRAINT lab_test_types_pkey PRIMARY KEY (id);


--
-- Name: lab_tests lab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_pkey PRIMARY KEY (id);


--
-- Name: local_system_facts local_system_facts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.local_system_facts
    ADD CONSTRAINT local_system_facts_pkey PRIMARY KEY (id);


--
-- Name: location_groups location_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_groups
    ADD CONSTRAINT location_groups_pkey PRIMARY KEY (id);


--
-- Name: locations locations_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_code_key UNIQUE (code);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: medication_administration_record_doses medication_administration_record_doses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_record_doses
    ADD CONSTRAINT medication_administration_record_doses_pkey PRIMARY KEY (id);


--
-- Name: medication_administration_records medication_administration_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_records
    ADD CONSTRAINT medication_administration_records_pkey PRIMARY KEY (id);


--
-- Name: note_items note_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_items
    ADD CONSTRAINT note_items_pkey PRIMARY KEY (id);


--
-- Name: note_pages note_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_pages
    ADD CONSTRAINT note_pages_pkey PRIMARY KEY (id);


--
-- Name: notes_legacy notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes_legacy
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey1 PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: one_time_logins one_time_logins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_logins
    ADD CONSTRAINT one_time_logins_pkey PRIMARY KEY (id);


--
-- Name: patient_additional_data patient_additional_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_pkey PRIMARY KEY (patient_id);


--
-- Name: patient_allergies patient_allergies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_pkey PRIMARY KEY (id);


--
-- Name: patient_birth_data patient_birth_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_birth_data
    ADD CONSTRAINT patient_birth_data_pkey PRIMARY KEY (patient_id);


--
-- Name: patient_care_plans patient_care_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_care_plans
    ADD CONSTRAINT patient_care_plans_pkey PRIMARY KEY (id);


--
-- Name: patient_communications patient_communications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_communications
    ADD CONSTRAINT patient_communications_pkey PRIMARY KEY (id);


--
-- Name: patient_conditions patient_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_conditions
    ADD CONSTRAINT patient_conditions_pkey PRIMARY KEY (id);


--
-- Name: patient_contacts patient_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_contacts
    ADD CONSTRAINT patient_contacts_pkey PRIMARY KEY (id);


--
-- Name: patient_death_data patient_death_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_pkey PRIMARY KEY (id);


--
-- Name: patient_facilities patient_facilities_patient_id_facility_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_facilities
    ADD CONSTRAINT patient_facilities_patient_id_facility_id_key UNIQUE (patient_id, facility_id);


--
-- Name: patient_facilities patient_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_facilities
    ADD CONSTRAINT patient_facilities_pkey PRIMARY KEY (facility_id, patient_id);


--
-- Name: patient_family_histories patient_family_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_family_histories
    ADD CONSTRAINT patient_family_histories_pkey PRIMARY KEY (id);


--
-- Name: patient_field_definition_categories patient_field_definition_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_field_definition_categories
    ADD CONSTRAINT patient_field_definition_categories_pkey PRIMARY KEY (id);


--
-- Name: patient_field_definitions patient_field_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_field_definitions
    ADD CONSTRAINT patient_field_definitions_pkey PRIMARY KEY (id);


--
-- Name: patient_field_values patient_field_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_field_values
    ADD CONSTRAINT patient_field_values_pkey PRIMARY KEY (patient_id, definition_id);


--
-- Name: patient_issues patient_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_issues
    ADD CONSTRAINT patient_issues_pkey PRIMARY KEY (id);


--
-- Name: templates patient_letter_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT patient_letter_templates_pkey PRIMARY KEY (id);


--
-- Name: patient_ongoing_prescriptions patient_ongoing_prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_ongoing_prescriptions
    ADD CONSTRAINT patient_ongoing_prescriptions_pkey PRIMARY KEY (id);


--
-- Name: patient_program_registration_conditions patient_program_registration_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registration_conditions
    ADD CONSTRAINT patient_program_registration_conditions_pkey PRIMARY KEY (id);


--
-- Name: patient_program_registrations patient_program_registrations_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_id_key UNIQUE (id);


--
-- Name: patient_program_registrations patient_program_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_pkey PRIMARY KEY (patient_id, program_registry_id);


--
-- Name: patient_secondary_ids patient_secondary_ids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_secondary_ids
    ADD CONSTRAINT patient_secondary_ids_pkey PRIMARY KEY (id);


--
-- Name: patient_vrs_data patient_vrs_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_vrs_data
    ADD CONSTRAINT patient_vrs_data_pkey PRIMARY KEY (id);


--
-- Name: patients patients_display_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_display_id_key UNIQUE (display_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pharmacy_order_prescriptions pharmacy_order_prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_order_prescriptions
    ADD CONSTRAINT pharmacy_order_prescriptions_pkey PRIMARY KEY (id);


--
-- Name: pharmacy_orders pharmacy_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_pkey PRIMARY KEY (id);


--
-- Name: portal_one_time_tokens portal_one_time_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_one_time_tokens
    ADD CONSTRAINT portal_one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: portal_survey_assignments portal_survey_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_survey_assignments
    ADD CONSTRAINT portal_survey_assignments_pkey PRIMARY KEY (id);


--
-- Name: portal_users portal_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_users
    ADD CONSTRAINT portal_users_email_key UNIQUE (email);


--
-- Name: portal_users portal_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_users
    ADD CONSTRAINT portal_users_pkey PRIMARY KEY (id);


--
-- Name: procedure_assistant_clinicians procedure_assistant_clinicians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_assistant_clinicians
    ADD CONSTRAINT procedure_assistant_clinicians_pkey PRIMARY KEY (id);


--
-- Name: procedure_survey_responses procedure_survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_survey_responses
    ADD CONSTRAINT procedure_survey_responses_pkey PRIMARY KEY (id);


--
-- Name: procedure_type_surveys procedure_type_survey_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_type_surveys
    ADD CONSTRAINT procedure_type_survey_unique UNIQUE (procedure_type_id, survey_id);


--
-- Name: procedure_type_surveys procedure_type_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_type_surveys
    ADD CONSTRAINT procedure_type_surveys_pkey PRIMARY KEY (id);


--
-- Name: procedures procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_pkey PRIMARY KEY (id);


--
-- Name: program_data_elements program_data_elements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_data_elements
    ADD CONSTRAINT program_data_elements_pkey PRIMARY KEY (id);


--
-- Name: program_registries program_registries_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registries
    ADD CONSTRAINT program_registries_code_key UNIQUE (code);


--
-- Name: program_registries program_registries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registries
    ADD CONSTRAINT program_registries_pkey PRIMARY KEY (id);


--
-- Name: program_registry_clinical_statuses program_registry_clinical_statuses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_clinical_statuses
    ADD CONSTRAINT program_registry_clinical_statuses_code_key UNIQUE (code);


--
-- Name: program_registry_clinical_statuses program_registry_clinical_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_clinical_statuses
    ADD CONSTRAINT program_registry_clinical_statuses_pkey PRIMARY KEY (id);


--
-- Name: program_registry_condition_categories program_registry_condition_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_condition_categories
    ADD CONSTRAINT program_registry_condition_categories_pkey PRIMARY KEY (id);


--
-- Name: program_registry_conditions program_registry_conditions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_conditions
    ADD CONSTRAINT program_registry_conditions_code_key UNIQUE (code);


--
-- Name: program_registry_conditions program_registry_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_conditions
    ADD CONSTRAINT program_registry_conditions_pkey PRIMARY KEY (id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: reference_data reference_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_data
    ADD CONSTRAINT reference_data_pkey PRIMARY KEY (id);


--
-- Name: reference_data_relations reference_data_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_data_relations
    ADD CONSTRAINT reference_data_relations_pkey PRIMARY KEY (id);


--
-- Name: reference_data_relations reference_data_relations_unique_index; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_data_relations
    ADD CONSTRAINT reference_data_relations_unique_index UNIQUE (reference_data_id, reference_data_parent_id, type);


--
-- Name: reference_drugs reference_drugs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_drugs
    ADD CONSTRAINT reference_drugs_pkey PRIMARY KEY (id);


--
-- Name: reference_drugs reference_drugs_reference_data_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_drugs
    ADD CONSTRAINT reference_drugs_reference_data_id_key UNIQUE (reference_data_id);


--
-- Name: reference_medication_templates reference_medication_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_medication_templates
    ADD CONSTRAINT reference_medication_templates_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: report_definition_versions report_definition_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_definition_versions
    ADD CONSTRAINT report_definition_versions_pkey PRIMARY KEY (id);


--
-- Name: report_definitions report_definitions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_definitions
    ADD CONSTRAINT report_definitions_name_key UNIQUE (name);


--
-- Name: report_definitions report_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_definitions
    ADD CONSTRAINT report_definitions_pkey PRIMARY KEY (id);


--
-- Name: report_requests report_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_requests
    ADD CONSTRAINT report_requests_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: scheduled_vaccines scheduled_vaccines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_vaccines
    ADD CONSTRAINT scheduled_vaccines_pkey PRIMARY KEY (id);


--
-- Name: settings settings_alive_key_unique_cnt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_alive_key_unique_cnt UNIQUE (key, facility_id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: socket_io_attachments socket_io_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socket_io_attachments
    ADD CONSTRAINT socket_io_attachments_pkey PRIMARY KEY (id);


--
-- Name: survey_response_answers survey_response_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_response_answers
    ADD CONSTRAINT survey_response_answers_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: survey_screen_components survey_screen_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_screen_components
    ADD CONSTRAINT survey_screen_components_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: sync_device_ticks sync_device_ticks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_device_ticks
    ADD CONSTRAINT sync_device_ticks_pkey PRIMARY KEY (persisted_at_sync_tick);


--
-- Name: sync_lookup sync_lookup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_lookup
    ADD CONSTRAINT sync_lookup_pkey PRIMARY KEY (id);


--
-- Name: sync_lookup sync_lookup_record_id_record_type_uk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_lookup
    ADD CONSTRAINT sync_lookup_record_id_record_type_uk UNIQUE (record_id, record_type);


--
-- Name: sync_lookup_ticks sync_lookup_ticks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_lookup_ticks
    ADD CONSTRAINT sync_lookup_ticks_pkey PRIMARY KEY (lookup_end_tick);


--
-- Name: sync_queued_devices sync_queued_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queued_devices
    ADD CONSTRAINT sync_queued_devices_pkey PRIMARY KEY (id);


--
-- Name: sync_sessions sync_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_sessions
    ADD CONSTRAINT sync_sessions_pkey PRIMARY KEY (id);


--
-- Name: task_designations task_designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_designations
    ADD CONSTRAINT task_designations_pkey PRIMARY KEY (id);


--
-- Name: task_template_designations task_template_designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_designations
    ADD CONSTRAINT task_template_designations_pkey PRIMARY KEY (id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: task_templates task_templates_reference_data_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_reference_data_id_key UNIQUE (reference_data_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: translated_strings translated_strings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translated_strings
    ADD CONSTRAINT translated_strings_pkey PRIMARY KEY (string_id, language);


--
-- Name: triages triages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triages
    ADD CONSTRAINT triages_pkey PRIMARY KEY (id);


--
-- Name: procedure_survey_responses unique_procedure_survey_response; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_survey_responses
    ADD CONSTRAINT unique_procedure_survey_response UNIQUE (procedure_id, survey_response_id);


--
-- Name: user_designations user_designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_designations
    ADD CONSTRAINT user_designations_pkey PRIMARY KEY (id);


--
-- Name: user_facilities user_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_facilities
    ADD CONSTRAINT user_facilities_pkey PRIMARY KEY (id);


--
-- Name: user_facilities user_facilities_user_id_facility_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_facilities
    ADD CONSTRAINT user_facilities_user_id_facility_id_key UNIQUE (user_id, facility_id);


--
-- Name: user_localisation_caches user_feature_flags_caches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_localisation_caches
    ADD CONSTRAINT user_feature_flags_caches_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_recently_viewed_patients user_recently_viewed_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recently_viewed_patients
    ADD CONSTRAINT user_recently_viewed_patients_pkey PRIMARY KEY (id);


--
-- Name: user_recently_viewed_patients user_recently_viewed_patients_user_id_patient_id_uk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recently_viewed_patients
    ADD CONSTRAINT user_recently_viewed_patients_user_id_patient_id_uk UNIQUE (user_id, patient_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: signers vds_nc_signers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signers
    ADD CONSTRAINT vds_nc_signers_pkey PRIMARY KEY (id);


--
-- Name: vital_logs vital_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_logs
    ADD CONSTRAINT vital_logs_pkey PRIMARY KEY (id);


--
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (id);


--
-- Name: encounters_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX encounters_id_version_id ON fhir.encounters USING btree (id, version_id);


--
-- Name: encounters_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE UNIQUE INDEX encounters_upstream_id ON fhir.encounters USING btree (upstream_id);


--
-- Name: immunizations_encounter_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_encounter_ginp ON fhir.immunizations USING gin (encounter jsonb_path_ops);


--
-- Name: immunizations_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_id_version_id ON fhir.immunizations USING btree (id, version_id);


--
-- Name: immunizations_last_updated_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_last_updated_idx ON fhir.immunizations USING btree (last_updated);


--
-- Name: immunizations_lot_number_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_lot_number_idx ON fhir.immunizations USING btree (lot_number);


--
-- Name: immunizations_occurrence_date_time_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_occurrence_date_time_idx ON fhir.immunizations USING btree (occurrence_date_time);


--
-- Name: immunizations_patient_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_patient_ginp ON fhir.immunizations USING gin (patient jsonb_path_ops);


--
-- Name: immunizations_performer_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_performer_ginp ON fhir.immunizations USING gin (performer jsonb_path_ops);


--
-- Name: immunizations_protocol_applied_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_protocol_applied_ginp ON fhir.immunizations USING gin (protocol_applied jsonb_path_ops);


--
-- Name: immunizations_site_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_site_ginp ON fhir.immunizations USING gin (site jsonb_path_ops);


--
-- Name: immunizations_status_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_status_idx ON fhir.immunizations USING btree (status);


--
-- Name: immunizations_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_upstream_id ON fhir.immunizations USING btree (upstream_id);


--
-- Name: immunizations_vaccine_code_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX immunizations_vaccine_code_ginp ON fhir.immunizations USING gin (vaccine_code jsonb_path_ops);


--
-- Name: job_grab_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX job_grab_idx ON fhir.jobs USING btree (topic, status, priority DESC, created_at);


--
-- Name: job_status_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX job_status_idx ON fhir.jobs USING btree (status);


--
-- Name: job_topic_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX job_topic_idx ON fhir.jobs USING btree (topic);


--
-- Name: medication_requests_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX medication_requests_id_version_id ON fhir.medication_requests USING btree (id, version_id);


--
-- Name: medication_requests_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX medication_requests_upstream_id ON fhir.medication_requests USING btree (upstream_id);


--
-- Name: non_fhir_medici_report_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX non_fhir_medici_report_id_version_id ON fhir.non_fhir_medici_report USING btree (id, version_id);


--
-- Name: non_fhir_medici_report_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX non_fhir_medici_report_upstream_id ON fhir.non_fhir_medici_report USING btree (upstream_id);


--
-- Name: organizations_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX organizations_id_version_id ON fhir.organizations USING btree (id, version_id);


--
-- Name: organizations_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE UNIQUE INDEX organizations_upstream_id ON fhir.organizations USING btree (upstream_id);


--
-- Name: patients_active_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_active_idx ON fhir.patients USING btree (active);


--
-- Name: patients_address_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_address_ginp ON fhir.patients USING gin (address jsonb_path_ops);


--
-- Name: patients_birth_date_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_birth_date_idx ON fhir.patients USING btree (birth_date);


--
-- Name: patients_deceased_date_time_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_deceased_date_time_idx ON fhir.patients USING btree (deceased_date_time);


--
-- Name: patients_extension_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_extension_ginp ON fhir.patients USING gin (extension jsonb_path_ops);


--
-- Name: patients_gender_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_gender_idx ON fhir.patients USING btree (gender);


--
-- Name: patients_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_id_version_id ON fhir.patients USING btree (id, version_id);


--
-- Name: patients_identifier_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_identifier_ginp ON fhir.patients USING gin (identifier jsonb_path_ops);


--
-- Name: patients_last_updated_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_last_updated_idx ON fhir.patients USING btree (last_updated);


--
-- Name: patients_link_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_link_ginp ON fhir.patients USING gin (link jsonb_path_ops);


--
-- Name: patients_telecom_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_telecom_ginp ON fhir.patients USING gin (telecom jsonb_path_ops);


--
-- Name: patients_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX patients_upstream_id ON fhir.patients USING btree (upstream_id);


--
-- Name: practitioners_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX practitioners_id_version_id ON fhir.practitioners USING btree (id, version_id);


--
-- Name: practitioners_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE UNIQUE INDEX practitioners_upstream_id ON fhir.practitioners USING btree (upstream_id);


--
-- Name: service_requests_category_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_category_ginp ON fhir.service_requests USING gin (category jsonb_path_ops);


--
-- Name: service_requests_code_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_code_ginp ON fhir.service_requests USING gin (code jsonb_path_ops);


--
-- Name: service_requests_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_id_version_id ON fhir.service_requests USING btree (id, version_id);


--
-- Name: service_requests_identifier_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_identifier_ginp ON fhir.service_requests USING gin (identifier jsonb_path_ops);


--
-- Name: service_requests_intent_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_intent_idx ON fhir.service_requests USING btree (intent);


--
-- Name: service_requests_last_updated_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_last_updated_idx ON fhir.service_requests USING btree (last_updated);


--
-- Name: service_requests_location_code_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_location_code_ginp ON fhir.service_requests USING gin (location_code jsonb_path_ops);


--
-- Name: service_requests_occurrence_date_time_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_occurrence_date_time_idx ON fhir.service_requests USING btree (occurrence_date_time);


--
-- Name: service_requests_order_detail_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_order_detail_ginp ON fhir.service_requests USING gin (order_detail jsonb_path_ops);


--
-- Name: service_requests_priority_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_priority_idx ON fhir.service_requests USING btree (priority);


--
-- Name: service_requests_requester_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_requester_ginp ON fhir.service_requests USING gin (requester jsonb_path_ops);


--
-- Name: service_requests_status_idx; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_status_idx ON fhir.service_requests USING btree (status);


--
-- Name: service_requests_subject_ginp; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_subject_ginp ON fhir.service_requests USING gin (subject jsonb_path_ops);


--
-- Name: service_requests_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX service_requests_upstream_id ON fhir.service_requests USING btree (upstream_id);


--
-- Name: specimens_id_version_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE INDEX specimens_id_version_id ON fhir.specimens USING btree (id, version_id);


--
-- Name: specimens_upstream_id; Type: INDEX; Schema: fhir; Owner: -
--

CREATE UNIQUE INDEX specimens_upstream_id ON fhir.specimens USING btree (upstream_id);


--
-- Name: accesses_updated_at_sync_tick_index; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX accesses_updated_at_sync_tick_index ON logs.accesses USING btree (updated_at_sync_tick);


--
-- Name: changes_device_id; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_device_id ON logs.changes USING btree (device_id);


--
-- Name: changes_logged_at; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_logged_at ON logs.changes USING brin (logged_at);


--
-- Name: changes_record_created_at; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_record_created_at ON logs.changes USING brin (record_created_at);


--
-- Name: changes_record_data; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_record_data ON logs.changes USING gin (record_data);


--
-- Name: changes_record_deleted_at; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_record_deleted_at ON logs.changes USING btree (record_deleted_at);


--
-- Name: changes_record_id; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_record_id ON logs.changes USING hash (record_id);


--
-- Name: changes_record_updated_at; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_record_updated_at ON logs.changes USING brin (record_updated_at);


--
-- Name: changes_table_name; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_table_name ON logs.changes USING btree ((((table_schema || '.'::text) || table_name)));


--
-- Name: changes_table_oid; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_table_oid ON logs.changes USING btree (table_oid);


--
-- Name: changes_updated_at_sync_tick_index; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_updated_at_sync_tick_index ON logs.changes USING btree (updated_at_sync_tick);


--
-- Name: changes_updated_by_user_id; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_updated_by_user_id ON logs.changes USING btree (updated_by_user_id);


--
-- Name: changes_version; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX changes_version ON logs.changes USING btree (version);


--
-- Name: fhir_writes_headers; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX fhir_writes_headers ON logs.fhir_writes USING gin (headers);


--
-- Name: fhir_writes_url; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX fhir_writes_url ON logs.fhir_writes USING btree (url);


--
-- Name: fhir_writes_verb; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX fhir_writes_verb ON logs.fhir_writes USING btree (verb);


--
-- Name: migrations_device_id; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX migrations_device_id ON logs.migrations USING hash (device_id);


--
-- Name: migrations_logged_at; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX migrations_logged_at ON logs.migrations USING btree (logged_at);


--
-- Name: migrations_record_sync_tick; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX migrations_record_sync_tick ON logs.migrations USING btree (record_sync_tick);


--
-- Name: migrations_updated_at_sync_tick_index; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX migrations_updated_at_sync_tick_index ON logs.migrations USING btree (updated_at_sync_tick);


--
-- Name: migrations_version; Type: INDEX; Schema: logs; Owner: -
--

CREATE INDEX migrations_version ON logs.migrations USING btree (version);


--
-- Name: administered_vaccines_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX administered_vaccines_encounter_id ON public.administered_vaccines USING btree (encounter_id);


--
-- Name: administered_vaccines_scheduled_vaccine_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX administered_vaccines_scheduled_vaccine_id ON public.administered_vaccines USING btree (scheduled_vaccine_id);


--
-- Name: administered_vaccines_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX administered_vaccines_updated_at ON public.administered_vaccines USING btree (updated_at);


--
-- Name: administered_vaccines_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX administered_vaccines_updated_at_sync_tick_index ON public.administered_vaccines USING btree (updated_at_sync_tick);


--
-- Name: appointment_schedules_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_schedules_updated_at_sync_tick_index ON public.appointment_schedules USING btree (updated_at_sync_tick);


--
-- Name: appointments_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_schedule_id ON public.appointments USING btree (schedule_id);


--
-- Name: appointments_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_updated_at ON public.appointments USING btree (updated_at);


--
-- Name: appointments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_updated_at_sync_tick_index ON public.appointments USING btree (updated_at_sync_tick);


--
-- Name: assets_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assets_updated_at ON public.assets USING btree (updated_at);


--
-- Name: assets_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assets_updated_at_sync_tick_index ON public.assets USING btree (updated_at_sync_tick);


--
-- Name: attachments_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attachments_updated_at ON public.attachments USING btree (updated_at);


--
-- Name: attachments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attachments_updated_at_sync_tick_index ON public.attachments USING btree (updated_at_sync_tick);


--
-- Name: certifiable_vaccines_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certifiable_vaccines_updated_at_sync_tick_index ON public.certifiable_vaccines USING btree (updated_at_sync_tick);


--
-- Name: certificate_notifications_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certificate_notifications_updated_at_sync_tick_index ON public.certificate_notifications USING btree (updated_at_sync_tick);


--
-- Name: contributing_death_causes_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contributing_death_causes_updated_at_sync_tick_index ON public.contributing_death_causes USING btree (updated_at_sync_tick);


--
-- Name: death_revert_logs_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX death_revert_logs_updated_at_sync_tick_index ON public.death_revert_logs USING btree (updated_at_sync_tick);


--
-- Name: departments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departments_updated_at_sync_tick_index ON public.departments USING btree (updated_at_sync_tick);


--
-- Name: discharges_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discharges_encounter_id ON public.discharges USING btree (encounter_id);


--
-- Name: discharges_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discharges_updated_at ON public.discharges USING btree (updated_at);


--
-- Name: discharges_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discharges_updated_at_sync_tick_index ON public.discharges USING btree (updated_at_sync_tick);


--
-- Name: document_metadata_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_metadata_encounter_id ON public.document_metadata USING btree (encounter_id);


--
-- Name: document_metadata_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_metadata_updated_at_sync_tick_index ON public.document_metadata USING btree (updated_at_sync_tick);


--
-- Name: encounter_diagnoses_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_diagnoses_encounter_id ON public.encounter_diagnoses USING btree (encounter_id);


--
-- Name: encounter_diagnoses_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_diagnoses_updated_at ON public.encounter_diagnoses USING btree (updated_at);


--
-- Name: encounter_diagnoses_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_diagnoses_updated_at_sync_tick_index ON public.encounter_diagnoses USING btree (updated_at_sync_tick);


--
-- Name: encounter_diets_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_diets_updated_at_sync_tick_index ON public.encounter_diets USING btree (updated_at_sync_tick);


--
-- Name: encounter_history_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_history_updated_at_sync_tick_index ON public.encounter_history USING btree (updated_at_sync_tick);


--
-- Name: encounter_medications_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_medications_updated_at ON public.prescriptions USING btree (updated_at);


--
-- Name: encounter_pause_prescription_histories_action_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_pause_prescription_histories_action_date ON public.encounter_pause_prescription_histories USING btree (action_date);


--
-- Name: encounter_pause_prescription_histories_encounter_prescription_i; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_pause_prescription_histories_encounter_prescription_i ON public.encounter_pause_prescription_histories USING btree (encounter_prescription_id);


--
-- Name: encounter_pause_prescription_histories_updated_at_sync_tick_ind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_pause_prescription_histories_updated_at_sync_tick_ind ON public.encounter_pause_prescription_histories USING btree (updated_at_sync_tick);


--
-- Name: encounter_pause_prescriptions_encounter_prescription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_pause_prescriptions_encounter_prescription_id ON public.encounter_pause_prescriptions USING btree (encounter_prescription_id);


--
-- Name: encounter_pause_prescriptions_pause_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_pause_prescriptions_pause_end_date ON public.encounter_pause_prescriptions USING btree (pause_end_date);


--
-- Name: encounter_pause_prescriptions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_pause_prescriptions_updated_at_sync_tick_index ON public.encounter_pause_prescriptions USING btree (updated_at_sync_tick);


--
-- Name: encounter_prescriptions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounter_prescriptions_updated_at_sync_tick_index ON public.encounter_prescriptions USING btree (updated_at_sync_tick);


--
-- Name: encounters_encounter_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_encounter_type ON public.encounters USING btree (encounter_type);


--
-- Name: encounters_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_end_date ON public.encounters USING btree (end_date);


--
-- Name: encounters_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_location_id ON public.encounters USING btree (location_id);


--
-- Name: encounters_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_patient_id ON public.encounters USING btree (patient_id);


--
-- Name: encounters_planned_location_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_planned_location_start_time ON public.encounters USING btree (planned_location_start_time);


--
-- Name: encounters_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_start_date ON public.encounters USING btree (start_date);


--
-- Name: encounters_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_updated_at ON public.encounters USING btree (updated_at);


--
-- Name: encounters_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_updated_at_sync_tick_index ON public.encounters USING btree (updated_at_sync_tick);


--
-- Name: facilities_catchment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facilities_catchment_id ON public.facilities USING btree (catchment_id);


--
-- Name: facilities_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facilities_updated_at_sync_tick_index ON public.facilities USING btree (updated_at_sync_tick);


--
-- Name: idx_appointment_schedules_is_fully_generated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_schedules_is_fully_generated ON public.appointment_schedules USING btree (is_fully_generated);


--
-- Name: idx_appointments_schedule_id_start_time_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_schedule_id_start_time_desc ON public.appointments USING btree (schedule_id, start_time DESC);


--
-- Name: idx_ep_prescription_encounter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ep_prescription_encounter ON public.encounter_prescriptions USING btree (prescription_id, encounter_id);


--
-- Name: idx_epp_encounter_prescription_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_epp_encounter_prescription_dates ON public.encounter_pause_prescriptions USING btree (encounter_prescription_id, pause_start_date, pause_end_date) WHERE (deleted_at IS NULL);


--
-- Name: idx_mar_prescription_due_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mar_prescription_due_status ON public.medication_administration_records USING btree (prescription_id, due_at, status) WHERE (deleted_at IS NULL);


--
-- Name: idx_patient_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_id_status ON public.portal_survey_assignments USING btree (patient_id, survey_id);


--
-- Name: idx_portal_one_time_tokens_portal_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_one_time_tokens_portal_user_id ON public.portal_one_time_tokens USING btree (portal_user_id);


--
-- Name: imaging_area_external_codes_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_area_external_codes_updated_at_sync_tick_index ON public.imaging_area_external_codes USING btree (updated_at_sync_tick);


--
-- Name: imaging_request_areas_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_request_areas_updated_at_sync_tick_index ON public.imaging_request_areas USING btree (updated_at_sync_tick);


--
-- Name: imaging_requests_display_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_requests_display_id ON public.imaging_requests USING btree (display_id);


--
-- Name: imaging_requests_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_requests_encounter_id ON public.imaging_requests USING btree (encounter_id);


--
-- Name: imaging_requests_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_requests_updated_at ON public.imaging_requests USING btree (updated_at);


--
-- Name: imaging_requests_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_requests_updated_at_sync_tick_index ON public.imaging_requests USING btree (updated_at_sync_tick);


--
-- Name: imaging_results_imaging_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imaging_results_imaging_request_id ON public.imaging_results USING btree (imaging_request_id);


--
-- Name: invoice_discounts_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_discounts_updated_at_sync_tick_index ON public.invoice_discounts USING btree (updated_at_sync_tick);


--
-- Name: invoice_insurer_payments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_insurer_payments_updated_at_sync_tick_index ON public.invoice_insurer_payments USING btree (updated_at_sync_tick);


--
-- Name: invoice_insurers_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_insurers_updated_at_sync_tick_index ON public.invoice_insurers USING btree (updated_at_sync_tick);


--
-- Name: invoice_item_discounts_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_item_discounts_updated_at_sync_tick_index ON public.invoice_item_discounts USING btree (updated_at_sync_tick);


--
-- Name: invoice_items_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_items_updated_at_sync_tick_index ON public.invoice_items USING btree (updated_at_sync_tick);


--
-- Name: invoice_patient_payments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_patient_payments_updated_at_sync_tick_index ON public.invoice_patient_payments USING btree (updated_at_sync_tick);


--
-- Name: invoice_payments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_payments_updated_at_sync_tick_index ON public.invoice_payments USING btree (updated_at_sync_tick);


--
-- Name: invoice_products_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_products_updated_at_sync_tick_index ON public.invoice_products USING btree (updated_at_sync_tick);


--
-- Name: invoices_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_updated_at_sync_tick_index ON public.invoices USING btree (updated_at_sync_tick);


--
-- Name: ips_requests_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ips_requests_updated_at_sync_tick_index ON public.ips_requests USING btree (updated_at_sync_tick);


--
-- Name: lab_request_attachments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_request_attachments_updated_at_sync_tick_index ON public.lab_request_attachments USING btree (updated_at_sync_tick);


--
-- Name: lab_request_logs_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_request_logs_updated_at ON public.lab_request_logs USING btree (updated_at);


--
-- Name: lab_request_logs_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_request_logs_updated_at_sync_tick_index ON public.lab_request_logs USING btree (updated_at_sync_tick);


--
-- Name: lab_requests_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_requests_encounter_id ON public.lab_requests USING btree (encounter_id);


--
-- Name: lab_requests_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_requests_updated_at ON public.lab_requests USING btree (updated_at);


--
-- Name: lab_requests_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_requests_updated_at_sync_tick_index ON public.lab_requests USING btree (updated_at_sync_tick);


--
-- Name: lab_test_panel_lab_test_types_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_test_panel_lab_test_types_updated_at_sync_tick_index ON public.lab_test_panel_lab_test_types USING btree (updated_at_sync_tick);


--
-- Name: lab_test_panel_requests_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_test_panel_requests_updated_at_sync_tick_index ON public.lab_test_panel_requests USING btree (updated_at_sync_tick);


--
-- Name: lab_test_panels_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_test_panels_updated_at_sync_tick_index ON public.lab_test_panels USING btree (updated_at_sync_tick);


--
-- Name: lab_test_types_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_test_types_updated_at ON public.lab_test_types USING btree (updated_at);


--
-- Name: lab_test_types_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_test_types_updated_at_sync_tick_index ON public.lab_test_types USING btree (updated_at_sync_tick);


--
-- Name: lab_tests_lab_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_tests_lab_request_id ON public.lab_tests USING btree (lab_request_id);


--
-- Name: lab_tests_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_tests_updated_at ON public.lab_tests USING btree (updated_at);


--
-- Name: lab_tests_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_tests_updated_at_sync_tick_index ON public.lab_tests USING btree (updated_at_sync_tick);


--
-- Name: local_system_facts_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX local_system_facts_key ON public.local_system_facts USING btree (key);


--
-- Name: local_system_facts_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX local_system_facts_updated_at ON public.local_system_facts USING btree (updated_at);


--
-- Name: location_groups_is_bookable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_groups_is_bookable ON public.location_groups USING btree (is_bookable);


--
-- Name: location_groups_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_groups_updated_at_sync_tick_index ON public.location_groups USING btree (updated_at_sync_tick);


--
-- Name: locations_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_updated_at ON public.locations USING btree (updated_at);


--
-- Name: locations_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_updated_at_sync_tick_index ON public.locations USING btree (updated_at_sync_tick);


--
-- Name: materialized_upcoming_vaccinations_unique_index; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX materialized_upcoming_vaccinations_unique_index ON public.materialized_upcoming_vaccinations USING btree (patient_id, scheduled_vaccine_id);


--
-- Name: medication_administration_record_doses_dose_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_administration_record_doses_dose_index ON public.medication_administration_record_doses USING btree (dose_index);


--
-- Name: medication_administration_record_doses_mar_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_administration_record_doses_mar_id ON public.medication_administration_record_doses USING btree (mar_id);


--
-- Name: medication_administration_record_doses_updated_at_sync_tick_ind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_administration_record_doses_updated_at_sync_tick_ind ON public.medication_administration_record_doses USING btree (updated_at_sync_tick);


--
-- Name: medication_administration_records_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_administration_records_updated_at_sync_tick_index ON public.medication_administration_records USING btree (updated_at_sync_tick);


--
-- Name: note_items_note_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_items_note_page_id ON public.note_items USING btree (note_page_id);


--
-- Name: note_items_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_items_updated_at_sync_tick_index ON public.note_items USING btree (updated_at_sync_tick);


--
-- Name: note_pages_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_pages_date ON public.note_pages USING btree (date);


--
-- Name: note_pages_record_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_pages_record_id ON public.note_pages USING btree (record_id);


--
-- Name: note_pages_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_pages_updated_at_sync_tick_index ON public.note_pages USING btree (updated_at_sync_tick);


--
-- Name: notes_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_date_idx ON public.notes USING btree (date);


--
-- Name: notes_legacy_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_legacy_updated_at_sync_tick_index ON public.notes_legacy USING btree (updated_at_sync_tick);


--
-- Name: notes_record_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_record_id_idx ON public.notes USING hash (record_id);


--
-- Name: notes_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_updated_at ON public.notes_legacy USING btree (updated_at);


--
-- Name: notes_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_updated_at_sync_tick_index ON public.notes USING btree (updated_at_sync_tick);


--
-- Name: notifications_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_updated_at_sync_tick_index ON public.notifications USING btree (updated_at_sync_tick);


--
-- Name: one_time_logins_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX one_time_logins_updated_at ON public.one_time_logins USING btree (updated_at);


--
-- Name: patient_additional_data_health_center_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_additional_data_health_center_id ON public.patient_additional_data USING btree (health_center_id);


--
-- Name: patient_additional_data_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_additional_data_patient_id ON public.patient_additional_data USING btree (patient_id);


--
-- Name: patient_additional_data_secondary_village_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_additional_data_secondary_village_id ON public.patient_additional_data USING btree (secondary_village_id);


--
-- Name: patient_additional_data_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_additional_data_updated_at ON public.patient_additional_data USING btree (updated_at);


--
-- Name: patient_additional_data_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_additional_data_updated_at_sync_tick_index ON public.patient_additional_data USING btree (updated_at_sync_tick);


--
-- Name: patient_allergies_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_allergies_patient_id ON public.patient_allergies USING btree (patient_id);


--
-- Name: patient_allergies_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_allergies_updated_at ON public.patient_allergies USING btree (updated_at);


--
-- Name: patient_allergies_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_allergies_updated_at_sync_tick_index ON public.patient_allergies USING btree (updated_at_sync_tick);


--
-- Name: patient_birth_data_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_birth_data_updated_at_sync_tick_index ON public.patient_birth_data USING btree (updated_at_sync_tick);


--
-- Name: patient_care_plans_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_care_plans_patient_id ON public.patient_care_plans USING btree (patient_id);


--
-- Name: patient_care_plans_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_care_plans_updated_at ON public.patient_care_plans USING btree (updated_at);


--
-- Name: patient_care_plans_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_care_plans_updated_at_sync_tick_index ON public.patient_care_plans USING btree (updated_at_sync_tick);


--
-- Name: patient_communications_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_communications_patient_id ON public.patient_communications USING btree (patient_id);


--
-- Name: patient_communications_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_communications_updated_at ON public.patient_communications USING btree (updated_at);


--
-- Name: patient_communications_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_communications_updated_at_sync_tick_index ON public.patient_communications USING btree (updated_at_sync_tick);


--
-- Name: patient_conditions_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_conditions_patient_id ON public.patient_conditions USING btree (patient_id);


--
-- Name: patient_conditions_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_conditions_updated_at ON public.patient_conditions USING btree (updated_at);


--
-- Name: patient_conditions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_conditions_updated_at_sync_tick_index ON public.patient_conditions USING btree (updated_at_sync_tick);


--
-- Name: patient_contacts_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_contacts_updated_at_sync_tick_index ON public.patient_contacts USING btree (updated_at_sync_tick);


--
-- Name: patient_death_data_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_death_data_updated_at_sync_tick_index ON public.patient_death_data USING btree (updated_at_sync_tick);


--
-- Name: patient_family_histories_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_family_histories_patient_id ON public.patient_family_histories USING btree (patient_id);


--
-- Name: patient_family_histories_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_family_histories_updated_at ON public.patient_family_histories USING btree (updated_at);


--
-- Name: patient_family_histories_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_family_histories_updated_at_sync_tick_index ON public.patient_family_histories USING btree (updated_at_sync_tick);


--
-- Name: patient_field_definition_categories_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_field_definition_categories_updated_at_sync_tick_index ON public.patient_field_definition_categories USING btree (updated_at_sync_tick);


--
-- Name: patient_field_definitions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_field_definitions_updated_at_sync_tick_index ON public.patient_field_definitions USING btree (updated_at_sync_tick);


--
-- Name: patient_field_values_definition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_field_values_definition_id ON public.patient_field_values USING btree (definition_id);


--
-- Name: patient_field_values_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_field_values_patient_id ON public.patient_field_values USING btree (patient_id);


--
-- Name: patient_field_values_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_field_values_updated_at ON public.patient_field_values USING btree (updated_at);


--
-- Name: patient_field_values_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_field_values_updated_at_sync_tick_index ON public.patient_field_values USING btree (updated_at_sync_tick);


--
-- Name: patient_issues_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_issues_patient_id ON public.patient_issues USING btree (patient_id);


--
-- Name: patient_issues_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_issues_updated_at ON public.patient_issues USING btree (updated_at);


--
-- Name: patient_issues_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_issues_updated_at_sync_tick_index ON public.patient_issues USING btree (updated_at_sync_tick);


--
-- Name: patient_ongoing_prescriptions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_ongoing_prescriptions_updated_at_sync_tick_index ON public.patient_ongoing_prescriptions USING btree (updated_at_sync_tick);


--
-- Name: patient_program_registration_conditions_updated_at_sync_tick_in; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_program_registration_conditions_updated_at_sync_tick_in ON public.patient_program_registration_conditions USING btree (updated_at_sync_tick);


--
-- Name: patient_program_registrations_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_program_registrations_updated_at_sync_tick_index ON public.patient_program_registrations USING btree (updated_at_sync_tick);


--
-- Name: patient_secondary_ids_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_secondary_ids_updated_at_sync_tick_index ON public.patient_secondary_ids USING btree (updated_at_sync_tick);


--
-- Name: patients_date_of_death; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_date_of_death ON public.patients USING btree (date_of_death);


--
-- Name: patients_merged_into_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_merged_into_id ON public.patients USING btree (merged_into_id);


--
-- Name: patients_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_updated_at ON public.patients USING btree (updated_at);


--
-- Name: patients_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_updated_at_sync_tick_index ON public.patients USING btree (updated_at_sync_tick);


--
-- Name: permissions_role_id_noun_verb; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_role_id_noun_verb ON public.permissions USING btree (role_id, noun, verb) WHERE (object_id IS NULL);


--
-- Name: permissions_role_id_noun_verb_object_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_role_id_noun_verb_object_id ON public.permissions USING btree (role_id, noun, verb, object_id) WHERE (object_id IS NOT NULL);


--
-- Name: permissions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX permissions_updated_at_sync_tick_index ON public.permissions USING btree (updated_at_sync_tick);


--
-- Name: pharmacy_order_prescriptions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pharmacy_order_prescriptions_updated_at_sync_tick_index ON public.pharmacy_order_prescriptions USING btree (updated_at_sync_tick);


--
-- Name: pharmacy_orders_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pharmacy_orders_updated_at_sync_tick_index ON public.pharmacy_orders USING btree (updated_at_sync_tick);


--
-- Name: portal_survey_assignments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX portal_survey_assignments_updated_at_sync_tick_index ON public.portal_survey_assignments USING btree (updated_at_sync_tick);


--
-- Name: portal_users_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX portal_users_updated_at_sync_tick_index ON public.portal_users USING btree (updated_at_sync_tick);


--
-- Name: prescriptions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX prescriptions_updated_at_sync_tick_index ON public.prescriptions USING btree (updated_at_sync_tick);


--
-- Name: procedure_assistant_clinicians_procedure_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_assistant_clinicians_procedure_id ON public.procedure_assistant_clinicians USING btree (procedure_id);


--
-- Name: procedure_assistant_clinicians_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_assistant_clinicians_updated_at_sync_tick_index ON public.procedure_assistant_clinicians USING btree (updated_at_sync_tick);


--
-- Name: procedure_assistant_clinicians_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_assistant_clinicians_user_id ON public.procedure_assistant_clinicians USING btree (user_id);


--
-- Name: procedure_survey_responses_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_survey_responses_updated_at_sync_tick_index ON public.procedure_survey_responses USING btree (updated_at_sync_tick);


--
-- Name: procedure_type_surveys_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_type_surveys_updated_at_sync_tick_index ON public.procedure_type_surveys USING btree (updated_at_sync_tick);


--
-- Name: procedures_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedures_encounter_id ON public.procedures USING btree (encounter_id);


--
-- Name: procedures_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedures_updated_at ON public.procedures USING btree (updated_at);


--
-- Name: procedures_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedures_updated_at_sync_tick_index ON public.procedures USING btree (updated_at_sync_tick);


--
-- Name: program_data_elements_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_data_elements_updated_at ON public.program_data_elements USING btree (updated_at);


--
-- Name: program_data_elements_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_data_elements_updated_at_sync_tick_index ON public.program_data_elements USING btree (updated_at_sync_tick);


--
-- Name: program_registries_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_registries_updated_at_sync_tick_index ON public.program_registries USING btree (updated_at_sync_tick);


--
-- Name: program_registry_clinical_statuses_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_registry_clinical_statuses_updated_at_sync_tick_index ON public.program_registry_clinical_statuses USING btree (updated_at_sync_tick);


--
-- Name: program_registry_condition_categories_program_registry_id_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX program_registry_condition_categories_program_registry_id_code ON public.program_registry_condition_categories USING btree (program_registry_id, code);


--
-- Name: program_registry_condition_categories_updated_at_sync_tick_inde; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_registry_condition_categories_updated_at_sync_tick_inde ON public.program_registry_condition_categories USING btree (updated_at_sync_tick);


--
-- Name: program_registry_conditions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_registry_conditions_updated_at_sync_tick_index ON public.program_registry_conditions USING btree (updated_at_sync_tick);


--
-- Name: programs_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX programs_updated_at ON public.programs USING btree (updated_at);


--
-- Name: programs_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX programs_updated_at_sync_tick_index ON public.programs USING btree (updated_at_sync_tick);


--
-- Name: reference_data_relations_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reference_data_relations_updated_at_sync_tick_index ON public.reference_data_relations USING btree (updated_at_sync_tick);


--
-- Name: reference_data_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reference_data_updated_at ON public.reference_data USING btree (updated_at);


--
-- Name: reference_data_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reference_data_updated_at_sync_tick_index ON public.reference_data USING btree (updated_at_sync_tick);


--
-- Name: reference_drugs_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reference_drugs_updated_at_sync_tick_index ON public.reference_drugs USING btree (updated_at_sync_tick);


--
-- Name: reference_medication_templates_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reference_medication_templates_updated_at_sync_tick_index ON public.reference_medication_templates USING btree (updated_at_sync_tick);


--
-- Name: referrals_completing_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_completing_encounter_id ON public.referrals USING btree (completing_encounter_id);


--
-- Name: referrals_initiating_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_initiating_encounter_id ON public.referrals USING btree (initiating_encounter_id);


--
-- Name: referrals_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_updated_at ON public.referrals USING btree (updated_at);


--
-- Name: referrals_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_updated_at_sync_tick_index ON public.referrals USING btree (updated_at_sync_tick);


--
-- Name: refresh_tokens_user_id_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_user_id_device_id ON public.refresh_tokens USING btree (user_id, device_id);


--
-- Name: report_definition_versions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX report_definition_versions_updated_at_sync_tick_index ON public.report_definition_versions USING btree (updated_at_sync_tick);


--
-- Name: report_definitions_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX report_definitions_updated_at_sync_tick_index ON public.report_definitions USING btree (updated_at_sync_tick);


--
-- Name: report_requests_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX report_requests_updated_at ON public.report_requests USING btree (updated_at);


--
-- Name: report_requests_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX report_requests_updated_at_sync_tick_index ON public.report_requests USING btree (updated_at_sync_tick);


--
-- Name: roles_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX roles_updated_at_sync_tick_index ON public.roles USING btree (updated_at_sync_tick);


--
-- Name: scheduled_vaccines_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scheduled_vaccines_updated_at ON public.scheduled_vaccines USING btree (updated_at);


--
-- Name: scheduled_vaccines_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scheduled_vaccines_updated_at_sync_tick_index ON public.scheduled_vaccines USING btree (updated_at_sync_tick);


--
-- Name: settings_alive_key_unique_with_facility_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX settings_alive_key_unique_with_facility_idx ON public.settings USING btree (key, facility_id) WHERE ((facility_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: settings_alive_key_unique_without_facility_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX settings_alive_key_unique_without_facility_idx ON public.settings USING btree (key) WHERE ((facility_id IS NULL) AND (deleted_at IS NULL));


--
-- Name: settings_facility_coalesced_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settings_facility_coalesced_idx ON public.settings USING btree (COALESCE(facility_id, '###'::character varying));


--
-- Name: settings_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settings_updated_at_sync_tick_index ON public.settings USING btree (updated_at_sync_tick);


--
-- Name: socket_io_attachments_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socket_io_attachments_updated_at_sync_tick_index ON public.socket_io_attachments USING btree (updated_at_sync_tick);


--
-- Name: survey_response_answers_body; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_response_answers_body ON public.survey_response_answers USING btree (body);


--
-- Name: survey_response_answers_response_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_response_answers_response_id ON public.survey_response_answers USING btree (response_id);


--
-- Name: survey_response_answers_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_response_answers_updated_at ON public.survey_response_answers USING btree (updated_at);


--
-- Name: survey_response_answers_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_response_answers_updated_at_sync_tick_index ON public.survey_response_answers USING btree (updated_at_sync_tick);


--
-- Name: survey_responses_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_responses_encounter_id ON public.survey_responses USING btree (encounter_id);


--
-- Name: survey_responses_survey_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_responses_survey_id ON public.survey_responses USING btree (survey_id);


--
-- Name: survey_responses_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_responses_updated_at ON public.survey_responses USING btree (updated_at);


--
-- Name: survey_responses_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_responses_updated_at_sync_tick_index ON public.survey_responses USING btree (updated_at_sync_tick);


--
-- Name: survey_screen_components_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_screen_components_updated_at ON public.survey_screen_components USING btree (updated_at);


--
-- Name: survey_screen_components_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX survey_screen_components_updated_at_sync_tick_index ON public.survey_screen_components USING btree (updated_at_sync_tick);


--
-- Name: surveys_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX surveys_updated_at ON public.surveys USING btree (updated_at);


--
-- Name: surveys_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX surveys_updated_at_sync_tick_index ON public.surveys USING btree (updated_at_sync_tick);


--
-- Name: sync_device_ticks_persisted_at_sync_tick; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_device_ticks_persisted_at_sync_tick ON public.sync_device_ticks USING btree (persisted_at_sync_tick);


--
-- Name: sync_lookup_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_lookup_patient_id ON public.sync_lookup USING btree (patient_id);


--
-- Name: sync_lookup_updated_at_sync_tick_record_id_patient_id_facility_; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_lookup_updated_at_sync_tick_record_id_patient_id_facility_ ON public.sync_lookup USING btree (updated_at_sync_tick, record_id, patient_id, facility_id);


--
-- Name: sync_queued_devices_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_queued_devices_id ON public.sync_queued_devices USING btree (id);


--
-- Name: sync_queued_devices_last_seen_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_queued_devices_last_seen_time ON public.sync_queued_devices USING btree (last_seen_time);


--
-- Name: sync_queued_devices_urgent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_queued_devices_urgent ON public.sync_queued_devices USING btree (urgent);


--
-- Name: sync_sessions_completed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sync_sessions_completed_at_idx ON public.sync_sessions USING btree (completed_at);


--
-- Name: task_designations_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_designations_updated_at_sync_tick_index ON public.task_designations USING btree (updated_at_sync_tick);


--
-- Name: task_template_designations_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_template_designations_updated_at_sync_tick_index ON public.task_template_designations USING btree (updated_at_sync_tick);


--
-- Name: task_templates_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_templates_updated_at_sync_tick_index ON public.task_templates USING btree (updated_at_sync_tick);


--
-- Name: tasks_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_updated_at_sync_tick_index ON public.tasks USING btree (updated_at_sync_tick);


--
-- Name: templates_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_updated_at_sync_tick_index ON public.templates USING btree (updated_at_sync_tick);


--
-- Name: translated_strings_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translated_strings_updated_at_sync_tick_index ON public.translated_strings USING btree (updated_at_sync_tick);


--
-- Name: triages_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triages_encounter_id ON public.triages USING btree (encounter_id);


--
-- Name: triages_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triages_updated_at ON public.triages USING btree (updated_at);


--
-- Name: triages_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triages_updated_at_sync_tick_index ON public.triages USING btree (updated_at_sync_tick);


--
-- Name: user_designations_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_designations_updated_at_sync_tick_index ON public.user_designations USING btree (updated_at_sync_tick);


--
-- Name: user_facilities_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_facilities_updated_at ON public.user_facilities USING btree (updated_at);


--
-- Name: user_facilities_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_facilities_updated_at_sync_tick_index ON public.user_facilities USING btree (updated_at_sync_tick);


--
-- Name: user_localisation_caches_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_localisation_caches_updated_at ON public.user_localisation_caches USING btree (updated_at);


--
-- Name: user_localisation_caches_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_localisation_caches_user_id ON public.user_localisation_caches USING btree (user_id);


--
-- Name: user_preferences_unique_with_facility_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_preferences_unique_with_facility_id ON public.user_preferences USING btree (key, user_id, COALESCE(facility_id, ''::character varying));


--
-- Name: user_preferences_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_preferences_updated_at_sync_tick_index ON public.user_preferences USING btree (updated_at_sync_tick);


--
-- Name: users_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_updated_at ON public.users USING btree (updated_at);


--
-- Name: users_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_updated_at_sync_tick_index ON public.users USING btree (updated_at_sync_tick);


--
-- Name: vds_nc_signers_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vds_nc_signers_deleted_at ON public.signers USING btree (deleted_at);


--
-- Name: vds_nc_signers_not_after; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vds_nc_signers_not_after ON public.signers USING btree (validity_period_end);


--
-- Name: vds_nc_signers_not_before; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vds_nc_signers_not_before ON public.signers USING btree (validity_period_start);


--
-- Name: vds_nc_signers_request_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vds_nc_signers_request_sent_at ON public.signers USING btree (request_sent_at);


--
-- Name: vds_nc_signers_working_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vds_nc_signers_working_period_end ON public.signers USING btree (working_period_end);


--
-- Name: vds_nc_signers_working_period_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vds_nc_signers_working_period_start ON public.signers USING btree (working_period_start);


--
-- Name: vital_logs_answer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_logs_answer_id ON public.vital_logs USING btree (answer_id);


--
-- Name: vital_logs_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_logs_updated_at_sync_tick_index ON public.vital_logs USING btree (updated_at_sync_tick);


--
-- Name: vitals_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vitals_encounter_id ON public.vitals USING btree (encounter_id);


--
-- Name: vitals_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vitals_updated_at ON public.vitals USING btree (updated_at);


--
-- Name: vitals_updated_at_sync_tick_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vitals_updated_at_sync_tick_index ON public.vitals USING btree (updated_at_sync_tick);


--
-- Name: jobs fhir_jobs_insert_trigger; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER fhir_jobs_insert_trigger AFTER INSERT ON fhir.jobs FOR EACH STATEMENT EXECUTE FUNCTION fhir.jobs_notify();


--
-- Name: encounters versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.encounters FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: immunizations versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.immunizations FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: medication_requests versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.medication_requests FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: organizations versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.organizations FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: patients versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.patients FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: practitioners versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.practitioners FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: service_requests versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.service_requests FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: specimens versioning; Type: TRIGGER; Schema: fhir; Owner: -
--

CREATE TRIGGER versioning BEFORE UPDATE ON fhir.specimens FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning();


--
-- Name: accesses notify_accesses_changed; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER notify_accesses_changed AFTER INSERT OR DELETE OR UPDATE ON logs.accesses FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: changes notify_changes_changed; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER notify_changes_changed AFTER INSERT OR DELETE OR UPDATE ON logs.changes FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: migrations notify_migrations_changed; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER notify_migrations_changed AFTER INSERT OR DELETE OR UPDATE ON logs.migrations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: fhir_writes record_fhir_writes_changelog; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER record_fhir_writes_changelog AFTER INSERT OR UPDATE ON logs.fhir_writes FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: migrations record_migrations_changelog; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER record_migrations_changelog AFTER INSERT OR UPDATE ON logs.migrations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: accesses set_accesses_updated_at; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER set_accesses_updated_at BEFORE INSERT OR UPDATE ON logs.accesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: accesses set_accesses_updated_at_sync_tick; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER set_accesses_updated_at_sync_tick BEFORE INSERT OR UPDATE ON logs.accesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: changes set_changes_updated_at; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER set_changes_updated_at BEFORE INSERT OR UPDATE ON logs.changes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: changes set_changes_updated_at_sync_tick; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER set_changes_updated_at_sync_tick BEFORE INSERT OR UPDATE ON logs.changes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: migrations set_migrations_updated_at; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER set_migrations_updated_at BEFORE INSERT OR UPDATE ON logs.migrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: migrations set_migrations_updated_at_sync_tick; Type: TRIGGER; Schema: logs; Owner: -
--

CREATE TRIGGER set_migrations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON logs.migrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: administered_vaccines fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.administered_vaccines FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: departments fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: discharges fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.discharges FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: encounter_diagnoses fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.encounter_diagnoses FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: encounter_history fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.encounter_history FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: encounters fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: facilities fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: imaging_area_external_codes fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.imaging_area_external_codes FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: imaging_request_areas fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.imaging_request_areas FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: imaging_requests fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.imaging_requests FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: lab_requests fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.lab_requests FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: lab_test_panel_requests fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_panel_requests FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: lab_test_panels fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_panels FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: lab_test_types fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_types FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: lab_tests fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.lab_tests FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: location_groups fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.location_groups FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: locations fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: note_items fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.note_items FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: note_pages fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.note_pages FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: notes fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: patient_additional_data fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.patient_additional_data FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: patient_birth_data fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.patient_birth_data FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: patients fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: pharmacy_order_prescriptions fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.pharmacy_order_prescriptions FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: pharmacy_orders fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: prescriptions fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: procedures fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: reference_data fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.reference_data FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: scheduled_vaccines fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.scheduled_vaccines FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: triages fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.triages FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: users fhir_refresh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fhir_refresh AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();


--
-- Name: administered_vaccines notify_administered_vaccines_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_administered_vaccines_changed AFTER INSERT OR DELETE OR UPDATE ON public.administered_vaccines FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: appointment_schedules notify_appointment_schedules_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_appointment_schedules_changed AFTER INSERT OR DELETE OR UPDATE ON public.appointment_schedules FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: appointments notify_appointments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_appointments_changed AFTER INSERT OR DELETE OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: assets notify_assets_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_assets_changed AFTER INSERT OR DELETE OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: attachments notify_attachments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_attachments_changed AFTER INSERT OR DELETE OR UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: certifiable_vaccines notify_certifiable_vaccines_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_certifiable_vaccines_changed AFTER INSERT OR DELETE OR UPDATE ON public.certifiable_vaccines FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: certificate_notifications notify_certificate_notifications_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_certificate_notifications_changed AFTER INSERT OR DELETE OR UPDATE ON public.certificate_notifications FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: contributing_death_causes notify_contributing_death_causes_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_contributing_death_causes_changed AFTER INSERT OR DELETE OR UPDATE ON public.contributing_death_causes FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: death_revert_logs notify_death_revert_logs_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_death_revert_logs_changed AFTER INSERT OR DELETE OR UPDATE ON public.death_revert_logs FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: departments notify_departments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_departments_changed AFTER INSERT OR DELETE OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: discharges notify_discharges_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_discharges_changed AFTER INSERT OR DELETE OR UPDATE ON public.discharges FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: document_metadata notify_document_metadata_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_document_metadata_changed AFTER INSERT OR DELETE OR UPDATE ON public.document_metadata FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounter_diagnoses notify_encounter_diagnoses_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounter_diagnoses_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounter_diagnoses FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounter_diets notify_encounter_diets_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounter_diets_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounter_diets FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounter_history notify_encounter_history_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounter_history_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounter_history FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounter_pause_prescription_histories notify_encounter_pause_prescription_histories_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounter_pause_prescription_histories_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounter_pause_prescription_histories FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounter_pause_prescriptions notify_encounter_pause_prescriptions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounter_pause_prescriptions_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounter_pause_prescriptions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounter_prescriptions notify_encounter_prescriptions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounter_prescriptions_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounter_prescriptions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: encounters notify_encounters_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_encounters_changed AFTER INSERT OR DELETE OR UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: facilities notify_facilities_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_facilities_changed AFTER INSERT OR DELETE OR UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: imaging_area_external_codes notify_imaging_area_external_codes_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_imaging_area_external_codes_changed AFTER INSERT OR DELETE OR UPDATE ON public.imaging_area_external_codes FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: imaging_request_areas notify_imaging_request_areas_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_imaging_request_areas_changed AFTER INSERT OR DELETE OR UPDATE ON public.imaging_request_areas FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: imaging_requests notify_imaging_requests_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_imaging_requests_changed AFTER INSERT OR DELETE OR UPDATE ON public.imaging_requests FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: imaging_results notify_imaging_results_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_imaging_results_changed AFTER INSERT OR DELETE OR UPDATE ON public.imaging_results FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_discounts notify_invoice_discounts_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_discounts_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_discounts FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_insurer_payments notify_invoice_insurer_payments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_insurer_payments_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_insurer_payments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_insurers notify_invoice_insurers_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_insurers_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_insurers FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_item_discounts notify_invoice_item_discounts_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_item_discounts_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_item_discounts FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_items notify_invoice_items_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_items_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_patient_payments notify_invoice_patient_payments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_patient_payments_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_patient_payments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_payments notify_invoice_payments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_payments_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoice_products notify_invoice_products_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoice_products_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoice_products FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: invoices notify_invoices_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_invoices_changed AFTER INSERT OR DELETE OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: ips_requests notify_ips_requests_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_ips_requests_changed AFTER INSERT OR DELETE OR UPDATE ON public.ips_requests FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_request_attachments notify_lab_request_attachments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_request_attachments_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_request_attachments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_request_logs notify_lab_request_logs_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_request_logs_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_request_logs FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_requests notify_lab_requests_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_requests_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_requests FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_test_panel_lab_test_types notify_lab_test_panel_lab_test_types_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_test_panel_lab_test_types_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_panel_lab_test_types FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_test_panel_requests notify_lab_test_panel_requests_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_test_panel_requests_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_panel_requests FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_test_panels notify_lab_test_panels_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_test_panels_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_panels FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_test_types notify_lab_test_types_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_test_types_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_test_types FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: lab_tests notify_lab_tests_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_lab_tests_changed AFTER INSERT OR DELETE OR UPDATE ON public.lab_tests FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: location_groups notify_location_groups_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_location_groups_changed AFTER INSERT OR DELETE OR UPDATE ON public.location_groups FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: locations notify_locations_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_locations_changed AFTER INSERT OR DELETE OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: medication_administration_record_doses notify_medication_administration_record_doses_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_medication_administration_record_doses_changed AFTER INSERT OR DELETE OR UPDATE ON public.medication_administration_record_doses FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: medication_administration_records notify_medication_administration_records_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_medication_administration_records_changed AFTER INSERT OR DELETE OR UPDATE ON public.medication_administration_records FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: note_items notify_note_items_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_note_items_changed AFTER INSERT OR DELETE OR UPDATE ON public.note_items FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: note_pages notify_note_pages_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_note_pages_changed AFTER INSERT OR DELETE OR UPDATE ON public.note_pages FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: notes notify_notes_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_notes_changed AFTER INSERT OR DELETE OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: notes_legacy notify_notes_legacy_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_notes_legacy_changed AFTER INSERT OR DELETE OR UPDATE ON public.notes_legacy FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: notifications notify_notifications_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_notifications_changed AFTER INSERT OR DELETE OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_additional_data notify_patient_additional_data_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_additional_data_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_additional_data FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_allergies notify_patient_allergies_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_allergies_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_allergies FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_birth_data notify_patient_birth_data_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_birth_data_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_birth_data FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_care_plans notify_patient_care_plans_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_care_plans_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_care_plans FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_communications notify_patient_communications_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_communications_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_communications FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_conditions notify_patient_conditions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_conditions_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_conditions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_contacts notify_patient_contacts_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_contacts_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_contacts FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_death_data notify_patient_death_data_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_death_data_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_death_data FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_facilities notify_patient_facilities_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_facilities_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_facilities FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_family_histories notify_patient_family_histories_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_family_histories_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_family_histories FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_field_definition_categories notify_patient_field_definition_categories_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_field_definition_categories_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_field_definition_categories FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_field_definitions notify_patient_field_definitions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_field_definitions_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_field_definitions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_field_values notify_patient_field_values_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_field_values_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_field_values FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_issues notify_patient_issues_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_issues_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_issues FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_ongoing_prescriptions notify_patient_ongoing_prescriptions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_ongoing_prescriptions_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_ongoing_prescriptions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_program_registration_conditions notify_patient_program_registration_conditions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_program_registration_conditions_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_program_registration_conditions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_program_registrations notify_patient_program_registrations_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_program_registrations_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_program_registrations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patient_secondary_ids notify_patient_secondary_ids_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patient_secondary_ids_changed AFTER INSERT OR DELETE OR UPDATE ON public.patient_secondary_ids FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: patients notify_patients_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_patients_changed AFTER INSERT OR DELETE OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: permissions notify_permissions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_permissions_changed AFTER INSERT OR DELETE OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: pharmacy_order_prescriptions notify_pharmacy_order_prescriptions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_pharmacy_order_prescriptions_changed AFTER INSERT OR DELETE OR UPDATE ON public.pharmacy_order_prescriptions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: pharmacy_orders notify_pharmacy_orders_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_pharmacy_orders_changed AFTER INSERT OR DELETE OR UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: portal_survey_assignments notify_portal_survey_assignments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_portal_survey_assignments_changed AFTER INSERT OR DELETE OR UPDATE ON public.portal_survey_assignments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: portal_users notify_portal_users_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_portal_users_changed AFTER INSERT OR DELETE OR UPDATE ON public.portal_users FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: prescriptions notify_prescriptions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_prescriptions_changed AFTER INSERT OR DELETE OR UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: procedure_assistant_clinicians notify_procedure_assistant_clinicians_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_procedure_assistant_clinicians_changed AFTER INSERT OR DELETE OR UPDATE ON public.procedure_assistant_clinicians FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: procedure_survey_responses notify_procedure_survey_responses_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_procedure_survey_responses_changed AFTER INSERT OR DELETE OR UPDATE ON public.procedure_survey_responses FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: procedure_type_surveys notify_procedure_type_surveys_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_procedure_type_surveys_changed AFTER INSERT OR DELETE OR UPDATE ON public.procedure_type_surveys FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: procedures notify_procedures_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_procedures_changed AFTER INSERT OR DELETE OR UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: program_data_elements notify_program_data_elements_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_program_data_elements_changed AFTER INSERT OR DELETE OR UPDATE ON public.program_data_elements FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: program_registries notify_program_registries_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_program_registries_changed AFTER INSERT OR DELETE OR UPDATE ON public.program_registries FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: program_registry_clinical_statuses notify_program_registry_clinical_statuses_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_program_registry_clinical_statuses_changed AFTER INSERT OR DELETE OR UPDATE ON public.program_registry_clinical_statuses FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: program_registry_condition_categories notify_program_registry_condition_categories_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_program_registry_condition_categories_changed AFTER INSERT OR DELETE OR UPDATE ON public.program_registry_condition_categories FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: program_registry_conditions notify_program_registry_conditions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_program_registry_conditions_changed AFTER INSERT OR DELETE OR UPDATE ON public.program_registry_conditions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: programs notify_programs_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_programs_changed AFTER INSERT OR DELETE OR UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: reference_data notify_reference_data_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_reference_data_changed AFTER INSERT OR DELETE OR UPDATE ON public.reference_data FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: reference_data_relations notify_reference_data_relations_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_reference_data_relations_changed AFTER INSERT OR DELETE OR UPDATE ON public.reference_data_relations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: reference_drugs notify_reference_drugs_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_reference_drugs_changed AFTER INSERT OR DELETE OR UPDATE ON public.reference_drugs FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: reference_medication_templates notify_reference_medication_templates_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_reference_medication_templates_changed AFTER INSERT OR DELETE OR UPDATE ON public.reference_medication_templates FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: referrals notify_referrals_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_referrals_changed AFTER INSERT OR DELETE OR UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: report_definition_versions notify_report_definition_versions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_report_definition_versions_changed AFTER INSERT OR DELETE OR UPDATE ON public.report_definition_versions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: report_definitions notify_report_definitions_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_report_definitions_changed AFTER INSERT OR DELETE OR UPDATE ON public.report_definitions FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: report_requests notify_report_requests_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_report_requests_changed AFTER INSERT OR DELETE OR UPDATE ON public.report_requests FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: roles notify_roles_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_roles_changed AFTER INSERT OR DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: scheduled_vaccines notify_scheduled_vaccines_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_scheduled_vaccines_changed AFTER INSERT OR DELETE OR UPDATE ON public.scheduled_vaccines FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: settings notify_settings_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_settings_changed AFTER INSERT OR DELETE OR UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: socket_io_attachments notify_socket_io_attachments_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_socket_io_attachments_changed AFTER INSERT OR DELETE OR UPDATE ON public.socket_io_attachments FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: survey_response_answers notify_survey_response_answers_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_survey_response_answers_changed AFTER INSERT OR DELETE OR UPDATE ON public.survey_response_answers FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: survey_responses notify_survey_responses_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_survey_responses_changed AFTER INSERT OR DELETE OR UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: survey_screen_components notify_survey_screen_components_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_survey_screen_components_changed AFTER INSERT OR DELETE OR UPDATE ON public.survey_screen_components FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: surveys notify_surveys_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_surveys_changed AFTER INSERT OR DELETE OR UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: task_designations notify_task_designations_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_task_designations_changed AFTER INSERT OR DELETE OR UPDATE ON public.task_designations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: task_template_designations notify_task_template_designations_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_task_template_designations_changed AFTER INSERT OR DELETE OR UPDATE ON public.task_template_designations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: task_templates notify_task_templates_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_task_templates_changed AFTER INSERT OR DELETE OR UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: tasks notify_tasks_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_tasks_changed AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: templates notify_templates_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_templates_changed AFTER INSERT OR DELETE OR UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: translated_strings notify_translated_strings_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_translated_strings_changed AFTER INSERT OR DELETE OR UPDATE ON public.translated_strings FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: triages notify_triages_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_triages_changed AFTER INSERT OR DELETE OR UPDATE ON public.triages FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: user_designations notify_user_designations_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_user_designations_changed AFTER INSERT OR DELETE OR UPDATE ON public.user_designations FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: user_facilities notify_user_facilities_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_user_facilities_changed AFTER INSERT OR DELETE OR UPDATE ON public.user_facilities FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: user_preferences notify_user_preferences_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_user_preferences_changed AFTER INSERT OR DELETE OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: users notify_users_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_users_changed AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: vital_logs notify_vital_logs_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_vital_logs_changed AFTER INSERT OR DELETE OR UPDATE ON public.vital_logs FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: vitals notify_vitals_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_vitals_changed AFTER INSERT OR DELETE OR UPDATE ON public.vitals FOR EACH ROW EXECUTE FUNCTION public.notify_table_changed();


--
-- Name: administered_vaccines record_administered_vaccines_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_administered_vaccines_changelog AFTER INSERT OR UPDATE ON public.administered_vaccines FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: appointment_schedules record_appointment_schedules_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_appointment_schedules_changelog AFTER INSERT OR UPDATE ON public.appointment_schedules FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: appointments record_appointments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_appointments_changelog AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: assets record_assets_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_assets_changelog AFTER INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: attachments record_attachments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_attachments_changelog AFTER INSERT OR UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: certifiable_vaccines record_certifiable_vaccines_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_certifiable_vaccines_changelog AFTER INSERT OR UPDATE ON public.certifiable_vaccines FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: certificate_notifications record_certificate_notifications_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_certificate_notifications_changelog AFTER INSERT OR UPDATE ON public.certificate_notifications FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: contributing_death_causes record_contributing_death_causes_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_contributing_death_causes_changelog AFTER INSERT OR UPDATE ON public.contributing_death_causes FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: death_revert_logs record_death_revert_logs_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_death_revert_logs_changelog AFTER INSERT OR UPDATE ON public.death_revert_logs FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: departments record_departments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_departments_changelog AFTER INSERT OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: devices record_devices_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_devices_changelog AFTER INSERT OR UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: discharges record_discharges_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_discharges_changelog AFTER INSERT OR UPDATE ON public.discharges FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: document_metadata record_document_metadata_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_document_metadata_changelog AFTER INSERT OR UPDATE ON public.document_metadata FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounter_diagnoses record_encounter_diagnoses_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounter_diagnoses_changelog AFTER INSERT OR UPDATE ON public.encounter_diagnoses FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounter_diets record_encounter_diets_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounter_diets_changelog AFTER INSERT OR UPDATE ON public.encounter_diets FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounter_history record_encounter_history_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounter_history_changelog AFTER INSERT OR UPDATE ON public.encounter_history FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounter_pause_prescription_histories record_encounter_pause_prescription_histories_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounter_pause_prescription_histories_changelog AFTER INSERT OR UPDATE ON public.encounter_pause_prescription_histories FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounter_pause_prescriptions record_encounter_pause_prescriptions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounter_pause_prescriptions_changelog AFTER INSERT OR UPDATE ON public.encounter_pause_prescriptions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounter_prescriptions record_encounter_prescriptions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounter_prescriptions_changelog AFTER INSERT OR UPDATE ON public.encounter_prescriptions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: encounters record_encounters_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_encounters_changelog AFTER INSERT OR UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: facilities record_facilities_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_facilities_changelog AFTER INSERT OR UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: imaging_area_external_codes record_imaging_area_external_codes_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_imaging_area_external_codes_changelog AFTER INSERT OR UPDATE ON public.imaging_area_external_codes FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: imaging_request_areas record_imaging_request_areas_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_imaging_request_areas_changelog AFTER INSERT OR UPDATE ON public.imaging_request_areas FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: imaging_requests record_imaging_requests_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_imaging_requests_changelog AFTER INSERT OR UPDATE ON public.imaging_requests FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: imaging_results record_imaging_results_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_imaging_results_changelog AFTER INSERT OR UPDATE ON public.imaging_results FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_discounts record_invoice_discounts_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_discounts_changelog AFTER INSERT OR UPDATE ON public.invoice_discounts FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_insurer_payments record_invoice_insurer_payments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_insurer_payments_changelog AFTER INSERT OR UPDATE ON public.invoice_insurer_payments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_insurers record_invoice_insurers_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_insurers_changelog AFTER INSERT OR UPDATE ON public.invoice_insurers FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_item_discounts record_invoice_item_discounts_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_item_discounts_changelog AFTER INSERT OR UPDATE ON public.invoice_item_discounts FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_items record_invoice_items_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_items_changelog AFTER INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_patient_payments record_invoice_patient_payments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_patient_payments_changelog AFTER INSERT OR UPDATE ON public.invoice_patient_payments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_payments record_invoice_payments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_payments_changelog AFTER INSERT OR UPDATE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoice_products record_invoice_products_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoice_products_changelog AFTER INSERT OR UPDATE ON public.invoice_products FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: invoices record_invoices_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_invoices_changelog AFTER INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: ips_requests record_ips_requests_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_ips_requests_changelog AFTER INSERT OR UPDATE ON public.ips_requests FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_request_attachments record_lab_request_attachments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_request_attachments_changelog AFTER INSERT OR UPDATE ON public.lab_request_attachments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_request_logs record_lab_request_logs_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_request_logs_changelog AFTER INSERT OR UPDATE ON public.lab_request_logs FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_requests record_lab_requests_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_requests_changelog AFTER INSERT OR UPDATE ON public.lab_requests FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_test_panel_lab_test_types record_lab_test_panel_lab_test_types_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_test_panel_lab_test_types_changelog AFTER INSERT OR UPDATE ON public.lab_test_panel_lab_test_types FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_test_panel_requests record_lab_test_panel_requests_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_test_panel_requests_changelog AFTER INSERT OR UPDATE ON public.lab_test_panel_requests FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_test_panels record_lab_test_panels_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_test_panels_changelog AFTER INSERT OR UPDATE ON public.lab_test_panels FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_test_types record_lab_test_types_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_test_types_changelog AFTER INSERT OR UPDATE ON public.lab_test_types FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: lab_tests record_lab_tests_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_lab_tests_changelog AFTER INSERT OR UPDATE ON public.lab_tests FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: location_groups record_location_groups_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_location_groups_changelog AFTER INSERT OR UPDATE ON public.location_groups FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: locations record_locations_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_locations_changelog AFTER INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: medication_administration_record_doses record_medication_administration_record_doses_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_medication_administration_record_doses_changelog AFTER INSERT OR UPDATE ON public.medication_administration_record_doses FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: medication_administration_records record_medication_administration_records_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_medication_administration_records_changelog AFTER INSERT OR UPDATE ON public.medication_administration_records FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: note_items record_note_items_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_note_items_changelog AFTER INSERT OR UPDATE ON public.note_items FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: note_pages record_note_pages_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_note_pages_changelog AFTER INSERT OR UPDATE ON public.note_pages FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: notes record_notes_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_notes_changelog AFTER INSERT OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: notes_legacy record_notes_legacy_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_notes_legacy_changelog AFTER INSERT OR UPDATE ON public.notes_legacy FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: notifications record_notifications_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_notifications_changelog AFTER INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_additional_data record_patient_additional_data_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_additional_data_changelog AFTER INSERT OR UPDATE ON public.patient_additional_data FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_allergies record_patient_allergies_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_allergies_changelog AFTER INSERT OR UPDATE ON public.patient_allergies FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_birth_data record_patient_birth_data_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_birth_data_changelog AFTER INSERT OR UPDATE ON public.patient_birth_data FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_care_plans record_patient_care_plans_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_care_plans_changelog AFTER INSERT OR UPDATE ON public.patient_care_plans FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_communications record_patient_communications_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_communications_changelog AFTER INSERT OR UPDATE ON public.patient_communications FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_conditions record_patient_conditions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_conditions_changelog AFTER INSERT OR UPDATE ON public.patient_conditions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_contacts record_patient_contacts_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_contacts_changelog AFTER INSERT OR UPDATE ON public.patient_contacts FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_death_data record_patient_death_data_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_death_data_changelog AFTER INSERT OR UPDATE ON public.patient_death_data FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_facilities record_patient_facilities_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_facilities_changelog AFTER INSERT OR UPDATE ON public.patient_facilities FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_family_histories record_patient_family_histories_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_family_histories_changelog AFTER INSERT OR UPDATE ON public.patient_family_histories FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_field_definition_categories record_patient_field_definition_categories_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_field_definition_categories_changelog AFTER INSERT OR UPDATE ON public.patient_field_definition_categories FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_field_definitions record_patient_field_definitions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_field_definitions_changelog AFTER INSERT OR UPDATE ON public.patient_field_definitions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_field_values record_patient_field_values_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_field_values_changelog AFTER INSERT OR UPDATE ON public.patient_field_values FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_issues record_patient_issues_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_issues_changelog AFTER INSERT OR UPDATE ON public.patient_issues FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_ongoing_prescriptions record_patient_ongoing_prescriptions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_ongoing_prescriptions_changelog AFTER INSERT OR UPDATE ON public.patient_ongoing_prescriptions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_program_registration_conditions record_patient_program_registration_conditions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_program_registration_conditions_changelog AFTER INSERT OR UPDATE ON public.patient_program_registration_conditions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_program_registrations record_patient_program_registrations_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_program_registrations_changelog AFTER INSERT OR UPDATE ON public.patient_program_registrations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patient_secondary_ids record_patient_secondary_ids_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patient_secondary_ids_changelog AFTER INSERT OR UPDATE ON public.patient_secondary_ids FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: patients record_patients_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_patients_changelog AFTER INSERT OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: permissions record_permissions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_permissions_changelog AFTER INSERT OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: pharmacy_order_prescriptions record_pharmacy_order_prescriptions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_pharmacy_order_prescriptions_changelog AFTER INSERT OR UPDATE ON public.pharmacy_order_prescriptions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: pharmacy_orders record_pharmacy_orders_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_pharmacy_orders_changelog AFTER INSERT OR UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: portal_one_time_tokens record_portal_one_time_tokens_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_portal_one_time_tokens_changelog AFTER INSERT OR UPDATE ON public.portal_one_time_tokens FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: portal_survey_assignments record_portal_survey_assignments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_portal_survey_assignments_changelog AFTER INSERT OR UPDATE ON public.portal_survey_assignments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: portal_users record_portal_users_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_portal_users_changelog AFTER INSERT OR UPDATE ON public.portal_users FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: prescriptions record_prescriptions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_prescriptions_changelog AFTER INSERT OR UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: procedure_assistant_clinicians record_procedure_assistant_clinicians_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_procedure_assistant_clinicians_changelog AFTER INSERT OR UPDATE ON public.procedure_assistant_clinicians FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: procedure_survey_responses record_procedure_survey_responses_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_procedure_survey_responses_changelog AFTER INSERT OR UPDATE ON public.procedure_survey_responses FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: procedure_type_surveys record_procedure_type_surveys_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_procedure_type_surveys_changelog AFTER INSERT OR UPDATE ON public.procedure_type_surveys FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: procedures record_procedures_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_procedures_changelog AFTER INSERT OR UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: program_data_elements record_program_data_elements_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_program_data_elements_changelog AFTER INSERT OR UPDATE ON public.program_data_elements FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: program_registries record_program_registries_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_program_registries_changelog AFTER INSERT OR UPDATE ON public.program_registries FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: program_registry_clinical_statuses record_program_registry_clinical_statuses_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_program_registry_clinical_statuses_changelog AFTER INSERT OR UPDATE ON public.program_registry_clinical_statuses FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: program_registry_condition_categories record_program_registry_condition_categories_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_program_registry_condition_categories_changelog AFTER INSERT OR UPDATE ON public.program_registry_condition_categories FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: program_registry_conditions record_program_registry_conditions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_program_registry_conditions_changelog AFTER INSERT OR UPDATE ON public.program_registry_conditions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: programs record_programs_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_programs_changelog AFTER INSERT OR UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: reference_data record_reference_data_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_reference_data_changelog AFTER INSERT OR UPDATE ON public.reference_data FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: reference_data_relations record_reference_data_relations_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_reference_data_relations_changelog AFTER INSERT OR UPDATE ON public.reference_data_relations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: reference_drugs record_reference_drugs_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_reference_drugs_changelog AFTER INSERT OR UPDATE ON public.reference_drugs FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: reference_medication_templates record_reference_medication_templates_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_reference_medication_templates_changelog AFTER INSERT OR UPDATE ON public.reference_medication_templates FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: referrals record_referrals_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_referrals_changelog AFTER INSERT OR UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: report_definition_versions record_report_definition_versions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_report_definition_versions_changelog AFTER INSERT OR UPDATE ON public.report_definition_versions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: report_definitions record_report_definitions_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_report_definitions_changelog AFTER INSERT OR UPDATE ON public.report_definitions FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: report_requests record_report_requests_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_report_requests_changelog AFTER INSERT OR UPDATE ON public.report_requests FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: roles record_roles_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_roles_changelog AFTER INSERT OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: scheduled_vaccines record_scheduled_vaccines_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_scheduled_vaccines_changelog AFTER INSERT OR UPDATE ON public.scheduled_vaccines FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: settings record_settings_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_settings_changelog AFTER INSERT OR UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: socket_io_attachments record_socket_io_attachments_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_socket_io_attachments_changelog AFTER INSERT OR UPDATE ON public.socket_io_attachments FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: survey_response_answers record_survey_response_answers_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_survey_response_answers_changelog AFTER INSERT OR UPDATE ON public.survey_response_answers FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: survey_responses record_survey_responses_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_survey_responses_changelog AFTER INSERT OR UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: survey_screen_components record_survey_screen_components_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_survey_screen_components_changelog AFTER INSERT OR UPDATE ON public.survey_screen_components FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: surveys record_surveys_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_surveys_changelog AFTER INSERT OR UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: task_designations record_task_designations_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_task_designations_changelog AFTER INSERT OR UPDATE ON public.task_designations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: task_template_designations record_task_template_designations_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_task_template_designations_changelog AFTER INSERT OR UPDATE ON public.task_template_designations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: task_templates record_task_templates_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_task_templates_changelog AFTER INSERT OR UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: tasks record_tasks_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_tasks_changelog AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: templates record_templates_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_templates_changelog AFTER INSERT OR UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: translated_strings record_translated_strings_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_translated_strings_changelog AFTER INSERT OR UPDATE ON public.translated_strings FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: triages record_triages_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_triages_changelog AFTER INSERT OR UPDATE ON public.triages FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: user_designations record_user_designations_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_user_designations_changelog AFTER INSERT OR UPDATE ON public.user_designations FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: user_facilities record_user_facilities_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_user_facilities_changelog AFTER INSERT OR UPDATE ON public.user_facilities FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: user_preferences record_user_preferences_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_user_preferences_changelog AFTER INSERT OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: users record_users_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_users_changelog AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: vital_logs record_vital_logs_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_vital_logs_changelog AFTER INSERT OR UPDATE ON public.vital_logs FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: vitals record_vitals_changelog; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_vitals_changelog AFTER INSERT OR UPDATE ON public.vitals FOR EACH ROW EXECUTE FUNCTION logs.record_change();


--
-- Name: administered_vaccines set_administered_vaccines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_administered_vaccines_updated_at BEFORE INSERT OR UPDATE ON public.administered_vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: administered_vaccines set_administered_vaccines_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_administered_vaccines_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.administered_vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: appointment_schedules set_appointment_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_appointment_schedules_updated_at BEFORE INSERT OR UPDATE ON public.appointment_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: appointment_schedules set_appointment_schedules_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_appointment_schedules_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.appointment_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: appointments set_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_appointments_updated_at BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: appointments set_appointments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_appointments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: assets set_assets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_assets_updated_at BEFORE INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: assets set_assets_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_assets_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: attachments set_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_attachments_updated_at BEFORE INSERT OR UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: attachments set_attachments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_attachments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: certifiable_vaccines set_certifiable_vaccines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_certifiable_vaccines_updated_at BEFORE INSERT OR UPDATE ON public.certifiable_vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: certifiable_vaccines set_certifiable_vaccines_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_certifiable_vaccines_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.certifiable_vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: certificate_notifications set_certificate_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_certificate_notifications_updated_at BEFORE INSERT OR UPDATE ON public.certificate_notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: certificate_notifications set_certificate_notifications_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_certificate_notifications_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.certificate_notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: contributing_death_causes set_contributing_death_causes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_contributing_death_causes_updated_at BEFORE INSERT OR UPDATE ON public.contributing_death_causes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contributing_death_causes set_contributing_death_causes_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_contributing_death_causes_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.contributing_death_causes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: death_revert_logs set_death_revert_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_death_revert_logs_updated_at BEFORE INSERT OR UPDATE ON public.death_revert_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: death_revert_logs set_death_revert_logs_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_death_revert_logs_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.death_revert_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: departments set_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_departments_updated_at BEFORE INSERT OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: departments set_departments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_departments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: discharges set_discharges_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_discharges_updated_at BEFORE INSERT OR UPDATE ON public.discharges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: discharges set_discharges_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_discharges_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.discharges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: document_metadata set_document_metadata_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_document_metadata_updated_at BEFORE INSERT OR UPDATE ON public.document_metadata FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: document_metadata set_document_metadata_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_document_metadata_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.document_metadata FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounter_diagnoses set_encounter_diagnoses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_diagnoses_updated_at BEFORE INSERT OR UPDATE ON public.encounter_diagnoses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounter_diagnoses set_encounter_diagnoses_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_diagnoses_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounter_diagnoses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounter_diets set_encounter_diets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_diets_updated_at BEFORE INSERT OR UPDATE ON public.encounter_diets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounter_diets set_encounter_diets_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_diets_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounter_diets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounter_history set_encounter_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_history_updated_at BEFORE INSERT OR UPDATE ON public.encounter_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounter_history set_encounter_history_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_history_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounter_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounter_pause_prescription_histories set_encounter_pause_prescription_histories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_pause_prescription_histories_updated_at BEFORE INSERT OR UPDATE ON public.encounter_pause_prescription_histories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounter_pause_prescription_histories set_encounter_pause_prescription_histories_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_pause_prescription_histories_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounter_pause_prescription_histories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounter_pause_prescriptions set_encounter_pause_prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_pause_prescriptions_updated_at BEFORE INSERT OR UPDATE ON public.encounter_pause_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounter_pause_prescriptions set_encounter_pause_prescriptions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_pause_prescriptions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounter_pause_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounter_prescriptions set_encounter_prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_prescriptions_updated_at BEFORE INSERT OR UPDATE ON public.encounter_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounter_prescriptions set_encounter_prescriptions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounter_prescriptions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounter_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: encounters set_encounters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounters_updated_at BEFORE INSERT OR UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: encounters set_encounters_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_encounters_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: facilities set_facilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_facilities_updated_at BEFORE INSERT OR UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: facilities set_facilities_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_facilities_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: imaging_area_external_codes set_imaging_area_external_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_area_external_codes_updated_at BEFORE INSERT OR UPDATE ON public.imaging_area_external_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: imaging_area_external_codes set_imaging_area_external_codes_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_area_external_codes_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.imaging_area_external_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: imaging_request_areas set_imaging_request_areas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_request_areas_updated_at BEFORE INSERT OR UPDATE ON public.imaging_request_areas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: imaging_request_areas set_imaging_request_areas_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_request_areas_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.imaging_request_areas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: imaging_requests set_imaging_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_requests_updated_at BEFORE INSERT OR UPDATE ON public.imaging_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: imaging_requests set_imaging_requests_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_requests_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.imaging_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: imaging_results set_imaging_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_results_updated_at BEFORE INSERT OR UPDATE ON public.imaging_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: imaging_results set_imaging_results_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_imaging_results_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.imaging_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_discounts set_invoice_discounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_discounts_updated_at BEFORE INSERT OR UPDATE ON public.invoice_discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_discounts set_invoice_discounts_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_discounts_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_insurer_payments set_invoice_insurer_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_insurer_payments_updated_at BEFORE INSERT OR UPDATE ON public.invoice_insurer_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_insurer_payments set_invoice_insurer_payments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_insurer_payments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_insurer_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_insurers set_invoice_insurers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_insurers_updated_at BEFORE INSERT OR UPDATE ON public.invoice_insurers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_insurers set_invoice_insurers_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_insurers_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_insurers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_item_discounts set_invoice_item_discounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_item_discounts_updated_at BEFORE INSERT OR UPDATE ON public.invoice_item_discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_item_discounts set_invoice_item_discounts_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_item_discounts_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_item_discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_items set_invoice_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_items_updated_at BEFORE INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_items set_invoice_items_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_items_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_patient_payments set_invoice_patient_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_patient_payments_updated_at BEFORE INSERT OR UPDATE ON public.invoice_patient_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_patient_payments set_invoice_patient_payments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_patient_payments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_patient_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_payments set_invoice_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_payments_updated_at BEFORE INSERT OR UPDATE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_payments set_invoice_payments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_payments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoice_products set_invoice_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_products_updated_at BEFORE INSERT OR UPDATE ON public.invoice_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_products set_invoice_products_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_products_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoice_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: invoices set_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoices_updated_at BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoices set_invoices_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoices_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: ips_requests set_ips_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_ips_requests_updated_at BEFORE INSERT OR UPDATE ON public.ips_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ips_requests set_ips_requests_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_ips_requests_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.ips_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_request_attachments set_lab_request_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_request_attachments_updated_at BEFORE INSERT OR UPDATE ON public.lab_request_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_request_attachments set_lab_request_attachments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_request_attachments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_request_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_request_logs set_lab_request_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_request_logs_updated_at BEFORE INSERT OR UPDATE ON public.lab_request_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_request_logs set_lab_request_logs_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_request_logs_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_request_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_requests set_lab_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_requests_updated_at BEFORE INSERT OR UPDATE ON public.lab_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_requests set_lab_requests_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_requests_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_test_panel_lab_test_types set_lab_test_panel_lab_test_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_panel_lab_test_types_updated_at BEFORE INSERT OR UPDATE ON public.lab_test_panel_lab_test_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_test_panel_lab_test_types set_lab_test_panel_lab_test_types_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_panel_lab_test_types_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_test_panel_lab_test_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_test_panel_requests set_lab_test_panel_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_panel_requests_updated_at BEFORE INSERT OR UPDATE ON public.lab_test_panel_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_test_panel_requests set_lab_test_panel_requests_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_panel_requests_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_test_panel_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_test_panels set_lab_test_panels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_panels_updated_at BEFORE INSERT OR UPDATE ON public.lab_test_panels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_test_panels set_lab_test_panels_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_panels_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_test_panels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_test_types set_lab_test_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_types_updated_at BEFORE INSERT OR UPDATE ON public.lab_test_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_test_types set_lab_test_types_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_test_types_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_test_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: lab_tests set_lab_tests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_tests_updated_at BEFORE INSERT OR UPDATE ON public.lab_tests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lab_tests set_lab_tests_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lab_tests_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.lab_tests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: location_groups set_location_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_location_groups_updated_at BEFORE INSERT OR UPDATE ON public.location_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: location_groups set_location_groups_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_location_groups_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.location_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: locations set_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_locations_updated_at BEFORE INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: locations set_locations_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_locations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: medication_administration_record_doses set_medication_administration_record_doses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_medication_administration_record_doses_updated_at BEFORE INSERT OR UPDATE ON public.medication_administration_record_doses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: medication_administration_record_doses set_medication_administration_record_doses_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_medication_administration_record_doses_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.medication_administration_record_doses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: medication_administration_records set_medication_administration_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_medication_administration_records_updated_at BEFORE INSERT OR UPDATE ON public.medication_administration_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: medication_administration_records set_medication_administration_records_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_medication_administration_records_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.medication_administration_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: note_items set_note_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_note_items_updated_at BEFORE INSERT OR UPDATE ON public.note_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: note_items set_note_items_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_note_items_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.note_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: note_pages set_note_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_note_pages_updated_at BEFORE INSERT OR UPDATE ON public.note_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: note_pages set_note_pages_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_note_pages_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.note_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: notes_legacy set_notes_legacy_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_notes_legacy_updated_at BEFORE INSERT OR UPDATE ON public.notes_legacy FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notes_legacy set_notes_legacy_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_notes_legacy_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.notes_legacy FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: notes set_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_notes_updated_at BEFORE INSERT OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notes set_notes_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_notes_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: notifications set_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_notifications_updated_at BEFORE INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notifications set_notifications_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_notifications_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_additional_data set_patient_additional_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_additional_data_updated_at BEFORE INSERT OR UPDATE ON public.patient_additional_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_additional_data set_patient_additional_data_updated_at_by_field; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_additional_data_updated_at_by_field BEFORE INSERT OR UPDATE ON public.patient_additional_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_by_field();


--
-- Name: patient_additional_data set_patient_additional_data_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_additional_data_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_additional_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_allergies set_patient_allergies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_allergies_updated_at BEFORE INSERT OR UPDATE ON public.patient_allergies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_allergies set_patient_allergies_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_allergies_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_allergies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_birth_data set_patient_birth_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_birth_data_updated_at BEFORE INSERT OR UPDATE ON public.patient_birth_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_birth_data set_patient_birth_data_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_birth_data_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_birth_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_care_plans set_patient_care_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_care_plans_updated_at BEFORE INSERT OR UPDATE ON public.patient_care_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_care_plans set_patient_care_plans_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_care_plans_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_care_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_communications set_patient_communications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_communications_updated_at BEFORE INSERT OR UPDATE ON public.patient_communications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_communications set_patient_communications_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_communications_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_communications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_conditions set_patient_conditions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_conditions_updated_at BEFORE INSERT OR UPDATE ON public.patient_conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_conditions set_patient_conditions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_conditions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_contacts set_patient_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_contacts_updated_at BEFORE INSERT OR UPDATE ON public.patient_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_contacts set_patient_contacts_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_contacts_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_death_data set_patient_death_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_death_data_updated_at BEFORE INSERT OR UPDATE ON public.patient_death_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_death_data set_patient_death_data_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_death_data_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_death_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_facilities set_patient_facilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_facilities_updated_at BEFORE INSERT OR UPDATE ON public.patient_facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_facilities set_patient_facilities_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_facilities_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_family_histories set_patient_family_histories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_family_histories_updated_at BEFORE INSERT OR UPDATE ON public.patient_family_histories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_family_histories set_patient_family_histories_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_family_histories_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_family_histories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_field_definition_categories set_patient_field_definition_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_field_definition_categories_updated_at BEFORE INSERT OR UPDATE ON public.patient_field_definition_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_field_definition_categories set_patient_field_definition_categories_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_field_definition_categories_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_field_definition_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_field_definitions set_patient_field_definitions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_field_definitions_updated_at BEFORE INSERT OR UPDATE ON public.patient_field_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_field_definitions set_patient_field_definitions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_field_definitions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_field_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_field_values set_patient_field_values_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_field_values_updated_at BEFORE INSERT OR UPDATE ON public.patient_field_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_field_values set_patient_field_values_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_field_values_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_field_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_issues set_patient_issues_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_issues_updated_at BEFORE INSERT OR UPDATE ON public.patient_issues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_issues set_patient_issues_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_issues_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_issues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_ongoing_prescriptions set_patient_ongoing_prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_ongoing_prescriptions_updated_at BEFORE INSERT OR UPDATE ON public.patient_ongoing_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_ongoing_prescriptions set_patient_ongoing_prescriptions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_ongoing_prescriptions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_ongoing_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_program_registration_conditions set_patient_program_registration_conditions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_program_registration_conditions_updated_at BEFORE INSERT OR UPDATE ON public.patient_program_registration_conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_program_registration_conditions set_patient_program_registration_conditions_updated_at_sync_tic; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_program_registration_conditions_updated_at_sync_tic BEFORE INSERT OR UPDATE ON public.patient_program_registration_conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_program_registrations set_patient_program_registrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_program_registrations_updated_at BEFORE INSERT OR UPDATE ON public.patient_program_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_program_registrations set_patient_program_registrations_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_program_registrations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_program_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patient_secondary_ids set_patient_secondary_ids_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_secondary_ids_updated_at BEFORE INSERT OR UPDATE ON public.patient_secondary_ids FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patient_secondary_ids set_patient_secondary_ids_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patient_secondary_ids_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patient_secondary_ids FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: patients set_patients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patients_updated_at BEFORE INSERT OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patients set_patients_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_patients_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: permissions set_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_permissions_updated_at BEFORE INSERT OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: permissions set_permissions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_permissions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: pharmacy_order_prescriptions set_pharmacy_order_prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pharmacy_order_prescriptions_updated_at BEFORE INSERT OR UPDATE ON public.pharmacy_order_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pharmacy_order_prescriptions set_pharmacy_order_prescriptions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pharmacy_order_prescriptions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.pharmacy_order_prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: pharmacy_orders set_pharmacy_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pharmacy_orders_updated_at BEFORE INSERT OR UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pharmacy_orders set_pharmacy_orders_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pharmacy_orders_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: portal_survey_assignments set_portal_survey_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_portal_survey_assignments_updated_at BEFORE INSERT OR UPDATE ON public.portal_survey_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: portal_survey_assignments set_portal_survey_assignments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_portal_survey_assignments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.portal_survey_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: portal_users set_portal_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_portal_users_updated_at BEFORE INSERT OR UPDATE ON public.portal_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: portal_users set_portal_users_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_portal_users_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.portal_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: prescriptions set_prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_prescriptions_updated_at BEFORE INSERT OR UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: prescriptions set_prescriptions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_prescriptions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: procedure_assistant_clinicians set_procedure_assistant_clinicians_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedure_assistant_clinicians_updated_at BEFORE INSERT OR UPDATE ON public.procedure_assistant_clinicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: procedure_assistant_clinicians set_procedure_assistant_clinicians_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedure_assistant_clinicians_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.procedure_assistant_clinicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: procedure_survey_responses set_procedure_survey_responses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedure_survey_responses_updated_at BEFORE INSERT OR UPDATE ON public.procedure_survey_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: procedure_survey_responses set_procedure_survey_responses_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedure_survey_responses_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.procedure_survey_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: procedure_type_surveys set_procedure_type_surveys_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedure_type_surveys_updated_at BEFORE INSERT OR UPDATE ON public.procedure_type_surveys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: procedure_type_surveys set_procedure_type_surveys_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedure_type_surveys_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.procedure_type_surveys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: procedures set_procedures_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedures_updated_at BEFORE INSERT OR UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: procedures set_procedures_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_procedures_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: program_data_elements set_program_data_elements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_data_elements_updated_at BEFORE INSERT OR UPDATE ON public.program_data_elements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_data_elements set_program_data_elements_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_data_elements_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.program_data_elements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: program_registries set_program_registries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registries_updated_at BEFORE INSERT OR UPDATE ON public.program_registries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_registries set_program_registries_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registries_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.program_registries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: program_registry_clinical_statuses set_program_registry_clinical_statuses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registry_clinical_statuses_updated_at BEFORE INSERT OR UPDATE ON public.program_registry_clinical_statuses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_registry_clinical_statuses set_program_registry_clinical_statuses_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registry_clinical_statuses_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.program_registry_clinical_statuses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: program_registry_condition_categories set_program_registry_condition_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registry_condition_categories_updated_at BEFORE INSERT OR UPDATE ON public.program_registry_condition_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_registry_condition_categories set_program_registry_condition_categories_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registry_condition_categories_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.program_registry_condition_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: program_registry_conditions set_program_registry_conditions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registry_conditions_updated_at BEFORE INSERT OR UPDATE ON public.program_registry_conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_registry_conditions set_program_registry_conditions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_program_registry_conditions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.program_registry_conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: programs set_programs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_programs_updated_at BEFORE INSERT OR UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: programs set_programs_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_programs_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: reference_data_relations set_reference_data_relations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_data_relations_updated_at BEFORE INSERT OR UPDATE ON public.reference_data_relations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reference_data_relations set_reference_data_relations_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_data_relations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.reference_data_relations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: reference_data set_reference_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_data_updated_at BEFORE INSERT OR UPDATE ON public.reference_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reference_data set_reference_data_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_data_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.reference_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: reference_drugs set_reference_drugs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_drugs_updated_at BEFORE INSERT OR UPDATE ON public.reference_drugs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reference_drugs set_reference_drugs_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_drugs_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.reference_drugs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: reference_medication_templates set_reference_medication_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_medication_templates_updated_at BEFORE INSERT OR UPDATE ON public.reference_medication_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reference_medication_templates set_reference_medication_templates_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_reference_medication_templates_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.reference_medication_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: referrals set_referrals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_referrals_updated_at BEFORE INSERT OR UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: referrals set_referrals_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_referrals_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: report_definition_versions set_report_definition_versions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_report_definition_versions_updated_at BEFORE INSERT OR UPDATE ON public.report_definition_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: report_definition_versions set_report_definition_versions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_report_definition_versions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.report_definition_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: report_definitions set_report_definitions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_report_definitions_updated_at BEFORE INSERT OR UPDATE ON public.report_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: report_definitions set_report_definitions_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_report_definitions_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.report_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: report_requests set_report_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_report_requests_updated_at BEFORE INSERT OR UPDATE ON public.report_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: report_requests set_report_requests_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_report_requests_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.report_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: roles set_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_roles_updated_at BEFORE INSERT OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: roles set_roles_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_roles_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: scheduled_vaccines set_scheduled_vaccines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_scheduled_vaccines_updated_at BEFORE INSERT OR UPDATE ON public.scheduled_vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: scheduled_vaccines set_scheduled_vaccines_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_scheduled_vaccines_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.scheduled_vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: settings set_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_settings_updated_at BEFORE INSERT OR UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: settings set_settings_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_settings_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: socket_io_attachments set_socket_io_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_socket_io_attachments_updated_at BEFORE INSERT OR UPDATE ON public.socket_io_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: socket_io_attachments set_socket_io_attachments_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_socket_io_attachments_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.socket_io_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: survey_response_answers set_survey_response_answers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_survey_response_answers_updated_at BEFORE INSERT OR UPDATE ON public.survey_response_answers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: survey_response_answers set_survey_response_answers_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_survey_response_answers_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.survey_response_answers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: survey_responses set_survey_responses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_survey_responses_updated_at BEFORE INSERT OR UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: survey_responses set_survey_responses_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_survey_responses_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: survey_screen_components set_survey_screen_components_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_survey_screen_components_updated_at BEFORE INSERT OR UPDATE ON public.survey_screen_components FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: survey_screen_components set_survey_screen_components_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_survey_screen_components_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.survey_screen_components FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: surveys set_surveys_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_surveys_updated_at BEFORE INSERT OR UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: surveys set_surveys_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_surveys_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: task_designations set_task_designations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_task_designations_updated_at BEFORE INSERT OR UPDATE ON public.task_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: task_designations set_task_designations_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_task_designations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.task_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: task_template_designations set_task_template_designations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_task_template_designations_updated_at BEFORE INSERT OR UPDATE ON public.task_template_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: task_template_designations set_task_template_designations_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_task_template_designations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.task_template_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: task_templates set_task_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_task_templates_updated_at BEFORE INSERT OR UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: task_templates set_task_templates_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_task_templates_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: tasks set_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_tasks_updated_at BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: tasks set_tasks_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_tasks_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: templates set_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_templates_updated_at BEFORE INSERT OR UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: templates set_templates_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_templates_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: translated_strings set_translated_strings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_translated_strings_updated_at BEFORE INSERT OR UPDATE ON public.translated_strings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: translated_strings set_translated_strings_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_translated_strings_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.translated_strings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: triages set_triages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_triages_updated_at BEFORE INSERT OR UPDATE ON public.triages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: triages set_triages_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_triages_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.triages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: user_designations set_user_designations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_designations_updated_at BEFORE INSERT OR UPDATE ON public.user_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_designations set_user_designations_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_designations_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.user_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: user_facilities set_user_facilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_facilities_updated_at BEFORE INSERT OR UPDATE ON public.user_facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_facilities set_user_facilities_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_facilities_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.user_facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: user_preferences set_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_preferences_updated_at BEFORE INSERT OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_preferences set_user_preferences_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_preferences_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_users_updated_at BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users set_users_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_users_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: vital_logs set_vital_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vital_logs_updated_at BEFORE INSERT OR UPDATE ON public.vital_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vital_logs set_vital_logs_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vital_logs_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.vital_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: vitals set_vitals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vitals_updated_at BEFORE INSERT OR UPDATE ON public.vitals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vitals set_vitals_updated_at_sync_tick; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vitals_updated_at_sync_tick BEFORE INSERT OR UPDATE ON public.vitals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_sync_tick();


--
-- Name: accesses accesses_facility_id_fkey; Type: FK CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.accesses
    ADD CONSTRAINT accesses_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: accesses accesses_user_id_fkey; Type: FK CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.accesses
    ADD CONSTRAINT accesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: changes changes_updated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.changes
    ADD CONSTRAINT changes_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id);


--
-- Name: fhir_writes fhir_writes_user_id_fkey; Type: FK CONSTRAINT; Schema: logs; Owner: -
--

ALTER TABLE ONLY logs.fhir_writes
    ADD CONSTRAINT fhir_writes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: administered_vaccines administered_vaccines_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: administered_vaccines administered_vaccines_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: administered_vaccines administered_vaccines_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: administered_vaccines administered_vaccines_not_given_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_not_given_reason_id_fkey FOREIGN KEY (not_given_reason_id) REFERENCES public.reference_data(id);


--
-- Name: administered_vaccines administered_vaccines_recorder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_recorder_id_fkey FOREIGN KEY (recorder_id) REFERENCES public.users(id);


--
-- Name: administered_vaccines administered_vaccines_scheduled_vaccine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administered_vaccines
    ADD CONSTRAINT administered_vaccines_scheduled_vaccine_id_fkey FOREIGN KEY (scheduled_vaccine_id) REFERENCES public.scheduled_vaccines(id);


--
-- Name: appointments appointments_appointment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_type_id_fkey FOREIGN KEY (appointment_type_id) REFERENCES public.reference_data(id);


--
-- Name: appointments appointments_booking_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_booking_type_id_fkey FOREIGN KEY (booking_type_id) REFERENCES public.reference_data(id);


--
-- Name: appointments appointments_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: appointments appointments_location_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_location_group_id_fkey FOREIGN KEY (location_group_id) REFERENCES public.location_groups(id);


--
-- Name: appointments appointments_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: appointments appointments_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.appointment_schedules(id);


--
-- Name: certifiable_vaccines certifiable_vaccines_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifiable_vaccines
    ADD CONSTRAINT certifiable_vaccines_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.reference_data(id);


--
-- Name: certifiable_vaccines certifiable_vaccines_vaccine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifiable_vaccines
    ADD CONSTRAINT certifiable_vaccines_vaccine_id_fkey FOREIGN KEY (vaccine_id) REFERENCES public.reference_data(id);


--
-- Name: certificate_notifications certificate_notifications_lab_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_notifications
    ADD CONSTRAINT certificate_notifications_lab_request_id_fkey FOREIGN KEY (lab_request_id) REFERENCES public.lab_requests(id);


--
-- Name: certificate_notifications certificate_notifications_lab_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_notifications
    ADD CONSTRAINT certificate_notifications_lab_test_id_fkey FOREIGN KEY (lab_test_id) REFERENCES public.lab_tests(id);


--
-- Name: certificate_notifications certificate_notifications_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_notifications
    ADD CONSTRAINT certificate_notifications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: contributing_death_causes death_causes_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributing_death_causes
    ADD CONSTRAINT death_causes_condition_id_fkey FOREIGN KEY (condition_id) REFERENCES public.reference_data(id);


--
-- Name: contributing_death_causes death_causes_patient_death_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributing_death_causes
    ADD CONSTRAINT death_causes_patient_death_data_id_fkey FOREIGN KEY (patient_death_data_id) REFERENCES public.patient_death_data(id);


--
-- Name: death_revert_logs death_revert_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.death_revert_logs
    ADD CONSTRAINT death_revert_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: death_revert_logs death_revert_logs_reverted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.death_revert_logs
    ADD CONSTRAINT death_revert_logs_reverted_by_id_fkey FOREIGN KEY (reverted_by_id) REFERENCES public.users(id);


--
-- Name: departments departments_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: devices devices_registered_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_registered_by_id_fkey FOREIGN KEY (registered_by_id) REFERENCES public.users(id);


--
-- Name: discharges discharges_discharger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discharges
    ADD CONSTRAINT discharges_discharger_id_fkey FOREIGN KEY (discharger_id) REFERENCES public.users(id);


--
-- Name: discharges discharges_disposition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discharges
    ADD CONSTRAINT discharges_disposition_id_fkey FOREIGN KEY (disposition_id) REFERENCES public.reference_data(id);


--
-- Name: discharges discharges_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discharges
    ADD CONSTRAINT discharges_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: document_metadata document_metadata_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT document_metadata_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: document_metadata document_metadata_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT document_metadata_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: document_metadata document_metadata_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT document_metadata_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: encounter_diagnoses encounter_diagnoses_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: encounter_diagnoses encounter_diagnoses_diagnosis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_diagnosis_id_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.reference_data(id);


--
-- Name: encounter_diagnoses encounter_diagnoses_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: encounter_diets encounter_diets_diet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diets
    ADD CONSTRAINT encounter_diets_diet_id_fkey FOREIGN KEY (diet_id) REFERENCES public.reference_data(id);


--
-- Name: encounter_diets encounter_diets_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_diets
    ADD CONSTRAINT encounter_diets_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: encounter_history encounter_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_history
    ADD CONSTRAINT encounter_history_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: encounter_history encounter_history_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_history
    ADD CONSTRAINT encounter_history_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: encounter_history encounter_history_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_history
    ADD CONSTRAINT encounter_history_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: encounter_history encounter_history_examiner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_history
    ADD CONSTRAINT encounter_history_examiner_id_fkey FOREIGN KEY (examiner_id) REFERENCES public.users(id);


--
-- Name: encounter_history encounter_history_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_history
    ADD CONSTRAINT encounter_history_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: prescriptions encounter_medications_discontinuing_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT encounter_medications_discontinuing_clinician_id_fkey FOREIGN KEY (discontinuing_clinician_id) REFERENCES public.users(id);


--
-- Name: prescriptions encounter_medications_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT encounter_medications_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.reference_data(id);


--
-- Name: prescriptions encounter_medications_prescriber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT encounter_medications_prescriber_id_fkey FOREIGN KEY (prescriber_id) REFERENCES public.users(id);


--
-- Name: encounter_pause_prescription_histories encounter_pause_prescription_his_encounter_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescription_histories
    ADD CONSTRAINT encounter_pause_prescription_his_encounter_prescription_id_fkey FOREIGN KEY (encounter_prescription_id) REFERENCES public.encounter_prescriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: encounter_pause_prescription_histories encounter_pause_prescription_histories_action_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescription_histories
    ADD CONSTRAINT encounter_pause_prescription_histories_action_user_id_fkey FOREIGN KEY (action_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounter_pause_prescriptions encounter_pause_prescriptions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescriptions
    ADD CONSTRAINT encounter_pause_prescriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounter_pause_prescriptions encounter_pause_prescriptions_encounter_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescriptions
    ADD CONSTRAINT encounter_pause_prescriptions_encounter_prescription_id_fkey FOREIGN KEY (encounter_prescription_id) REFERENCES public.encounter_prescriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: encounter_pause_prescriptions encounter_pause_prescriptions_pausing_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescriptions
    ADD CONSTRAINT encounter_pause_prescriptions_pausing_clinician_id_fkey FOREIGN KEY (pausing_clinician_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounter_pause_prescriptions encounter_pause_prescriptions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_pause_prescriptions
    ADD CONSTRAINT encounter_pause_prescriptions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounter_prescriptions encounter_prescriptions_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_prescriptions
    ADD CONSTRAINT encounter_prescriptions_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: encounter_prescriptions encounter_prescriptions_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_prescriptions
    ADD CONSTRAINT encounter_prescriptions_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);


--
-- Name: encounters encounters_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounters encounters_examiner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_examiner_id_fkey FOREIGN KEY (examiner_id) REFERENCES public.users(id);


--
-- Name: encounters encounters_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounters encounters_patient_billing_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_patient_billing_type_id_fkey FOREIGN KEY (patient_billing_type_id) REFERENCES public.reference_data(id);


--
-- Name: encounters encounters_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: encounters encounters_planned_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_planned_location_id_fkey FOREIGN KEY (planned_location_id) REFERENCES public.locations(id);


--
-- Name: encounters encounters_referral_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_referral_source_id_fkey FOREIGN KEY (referral_source_id) REFERENCES public.reference_data(id);


--
-- Name: facilities facilities_catchment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_catchment_id_fkey FOREIGN KEY (catchment_id) REFERENCES public.reference_data(id);


--
-- Name: imaging_area_external_codes imaging_area_external_codes_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_area_external_codes
    ADD CONSTRAINT imaging_area_external_codes_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.reference_data(id);


--
-- Name: imaging_request_areas imaging_request_area_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_request_areas
    ADD CONSTRAINT imaging_request_area_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.reference_data(id);


--
-- Name: imaging_request_areas imaging_request_area_imaging_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_request_areas
    ADD CONSTRAINT imaging_request_area_imaging_request_id_fkey FOREIGN KEY (imaging_request_id) REFERENCES public.imaging_requests(id) ON UPDATE CASCADE;


--
-- Name: imaging_requests imaging_requests_completed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_requests
    ADD CONSTRAINT imaging_requests_completed_by_id_fkey FOREIGN KEY (completed_by_id) REFERENCES public.users(id);


--
-- Name: imaging_requests imaging_requests_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_requests
    ADD CONSTRAINT imaging_requests_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: imaging_requests imaging_requests_location_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_requests
    ADD CONSTRAINT imaging_requests_location_group_id_fkey FOREIGN KEY (location_group_id) REFERENCES public.location_groups(id);


--
-- Name: imaging_requests imaging_requests_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_requests
    ADD CONSTRAINT imaging_requests_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: imaging_requests imaging_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_requests
    ADD CONSTRAINT imaging_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.users(id);


--
-- Name: imaging_results imaging_results_completed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_completed_by_id_fkey FOREIGN KEY (completed_by_id) REFERENCES public.users(id);


--
-- Name: imaging_results imaging_results_imaging_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_imaging_request_id_fkey FOREIGN KEY (imaging_request_id) REFERENCES public.imaging_requests(id) ON UPDATE CASCADE;


--
-- Name: invoice_discounts invoice_discounts_applied_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_discounts
    ADD CONSTRAINT invoice_discounts_applied_by_user_id_fkey FOREIGN KEY (applied_by_user_id) REFERENCES public.users(id);


--
-- Name: invoice_discounts invoice_discounts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_discounts
    ADD CONSTRAINT invoice_discounts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoice_insurer_payments invoice_insurer_payments_invoice_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_insurer_payments
    ADD CONSTRAINT invoice_insurer_payments_invoice_payment_id_fkey FOREIGN KEY (invoice_payment_id) REFERENCES public.invoice_payments(id);


--
-- Name: invoice_insurers invoice_insurers_insurer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_insurers
    ADD CONSTRAINT invoice_insurers_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.reference_data(id);


--
-- Name: invoice_insurers invoice_insurers_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_insurers
    ADD CONSTRAINT invoice_insurers_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoice_item_discounts invoice_item_discounts_invoice_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_item_discounts
    ADD CONSTRAINT invoice_item_discounts_invoice_item_id_fkey FOREIGN KEY (invoice_item_id) REFERENCES public.invoice_items(id);


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoice_items invoice_items_ordered_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_ordered_by_user_id_fkey FOREIGN KEY (ordered_by_user_id) REFERENCES public.users(id);


--
-- Name: invoice_items invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.invoice_products(id);


--
-- Name: invoice_patient_payments invoice_patient_payments_invoice_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_patient_payments
    ADD CONSTRAINT invoice_patient_payments_invoice_payment_id_fkey FOREIGN KEY (invoice_payment_id) REFERENCES public.invoice_payments(id);


--
-- Name: invoice_payments invoice_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoice_payments invoice_payments_updated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: ips_requests ips_requests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ips_requests
    ADD CONSTRAINT ips_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: ips_requests ips_requests_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ips_requests
    ADD CONSTRAINT ips_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: lab_request_attachments lab_request_attachments_lab_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_request_attachments
    ADD CONSTRAINT lab_request_attachments_lab_request_id_fkey FOREIGN KEY (lab_request_id) REFERENCES public.lab_requests(id);


--
-- Name: lab_request_logs lab_request_logs_lab_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_request_logs
    ADD CONSTRAINT lab_request_logs_lab_request_id_fkey FOREIGN KEY (lab_request_id) REFERENCES public.lab_requests(id);


--
-- Name: lab_request_logs lab_request_logs_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_request_logs
    ADD CONSTRAINT lab_request_logs_updated_by_id_fkey FOREIGN KEY (updated_by_id) REFERENCES public.users(id);


--
-- Name: lab_requests lab_requests_collected_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_collected_by_id_fkey FOREIGN KEY (collected_by_id) REFERENCES public.users(id);


--
-- Name: lab_requests lab_requests_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: lab_requests lab_requests_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: lab_requests lab_requests_lab_sample_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_lab_sample_site_id_fkey FOREIGN KEY (lab_sample_site_id) REFERENCES public.reference_data(id);


--
-- Name: lab_requests lab_requests_lab_test_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_lab_test_category_id_fkey FOREIGN KEY (lab_test_category_id) REFERENCES public.reference_data(id);


--
-- Name: lab_requests lab_requests_lab_test_laboratory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_lab_test_laboratory_id_fkey FOREIGN KEY (lab_test_laboratory_id) REFERENCES public.reference_data(id);


--
-- Name: lab_requests lab_requests_lab_test_panel_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_lab_test_panel_request_id_fkey FOREIGN KEY (lab_test_panel_request_id) REFERENCES public.lab_test_panel_requests(id);


--
-- Name: lab_requests lab_requests_lab_test_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_lab_test_priority_id_fkey FOREIGN KEY (lab_test_priority_id) REFERENCES public.reference_data(id);


--
-- Name: lab_requests lab_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.users(id);


--
-- Name: lab_requests lab_requests_specimen_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_specimen_type_id_fkey FOREIGN KEY (specimen_type_id) REFERENCES public.reference_data(id);


--
-- Name: lab_test_panel_lab_test_types lab_test_panel_lab_test_types_lab_test_panel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panel_lab_test_types
    ADD CONSTRAINT lab_test_panel_lab_test_types_lab_test_panel_id_fkey FOREIGN KEY (lab_test_panel_id) REFERENCES public.lab_test_panels(id);


--
-- Name: lab_test_panel_lab_test_types lab_test_panel_lab_test_types_lab_test_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panel_lab_test_types
    ADD CONSTRAINT lab_test_panel_lab_test_types_lab_test_type_id_fkey FOREIGN KEY (lab_test_type_id) REFERENCES public.lab_test_types(id);


--
-- Name: lab_test_panel_requests lab_test_panel_requests_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panel_requests
    ADD CONSTRAINT lab_test_panel_requests_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: lab_test_panel_requests lab_test_panel_requests_lab_test_panel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panel_requests
    ADD CONSTRAINT lab_test_panel_requests_lab_test_panel_id_fkey FOREIGN KEY (lab_test_panel_id) REFERENCES public.lab_test_panels(id);


--
-- Name: lab_test_panels lab_test_panels_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_panels
    ADD CONSTRAINT lab_test_panels_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.reference_data(id);


--
-- Name: lab_test_types lab_test_types_lab_test_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_types
    ADD CONSTRAINT lab_test_types_lab_test_category_id_fkey FOREIGN KEY (lab_test_category_id) REFERENCES public.reference_data(id);


--
-- Name: lab_tests lab_tests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.reference_data(id);


--
-- Name: lab_tests lab_tests_lab_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_lab_request_id_fkey FOREIGN KEY (lab_request_id) REFERENCES public.lab_requests(id);


--
-- Name: lab_tests lab_tests_lab_test_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_lab_test_method_id_fkey FOREIGN KEY (lab_test_method_id) REFERENCES public.reference_data(id);


--
-- Name: lab_tests lab_tests_lab_test_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_lab_test_type_id_fkey FOREIGN KEY (lab_test_type_id) REFERENCES public.lab_test_types(id);


--
-- Name: location_groups location_groups_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_groups
    ADD CONSTRAINT location_groups_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: locations locations_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: locations locations_location_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_location_group_id_fkey FOREIGN KEY (location_group_id) REFERENCES public.location_groups(id);


--
-- Name: medication_administration_record_doses medication_administration_record_doses_given_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_record_doses
    ADD CONSTRAINT medication_administration_record_doses_given_by_user_id_fkey FOREIGN KEY (given_by_user_id) REFERENCES public.users(id);


--
-- Name: medication_administration_record_doses medication_administration_record_doses_mar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_record_doses
    ADD CONSTRAINT medication_administration_record_doses_mar_id_fkey FOREIGN KEY (mar_id) REFERENCES public.medication_administration_records(id);


--
-- Name: medication_administration_record_doses medication_administration_record_doses_recorded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_record_doses
    ADD CONSTRAINT medication_administration_record_doses_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users(id);


--
-- Name: medication_administration_records medication_administration_records_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_records
    ADD CONSTRAINT medication_administration_records_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);


--
-- Name: medication_administration_records medication_administration_records_reason_not_given_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_records
    ADD CONSTRAINT medication_administration_records_reason_not_given_id_fkey FOREIGN KEY (reason_not_given_id) REFERENCES public.reference_data(id);


--
-- Name: medication_administration_records medication_administration_records_recorded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_administration_records
    ADD CONSTRAINT medication_administration_records_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users(id);


--
-- Name: note_items note_items_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_items
    ADD CONSTRAINT note_items_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: note_items note_items_note_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_items
    ADD CONSTRAINT note_items_note_page_id_fkey FOREIGN KEY (note_page_id) REFERENCES public.note_pages(id);


--
-- Name: note_items note_items_on_behalf_of_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_items
    ADD CONSTRAINT note_items_on_behalf_of_id_fkey FOREIGN KEY (on_behalf_of_id) REFERENCES public.users(id);


--
-- Name: notes_legacy notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes_legacy
    ADD CONSTRAINT notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: notes notes_author_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_author_id_fkey1 FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: notes_legacy notes_on_behalf_of_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes_legacy
    ADD CONSTRAINT notes_on_behalf_of_id_fkey FOREIGN KEY (on_behalf_of_id) REFERENCES public.users(id);


--
-- Name: notes notes_on_behalf_of_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_on_behalf_of_id_fkey1 FOREIGN KEY (on_behalf_of_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: one_time_logins one_time_logins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_logins
    ADD CONSTRAINT one_time_logins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: patient_additional_data patient_additional_data_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_country_of_birth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_country_of_birth_id_fkey FOREIGN KEY (country_of_birth_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_division_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_ethnicity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_ethnicity_id_fkey FOREIGN KEY (ethnicity_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_father_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_father_id_fkey FOREIGN KEY (father_id) REFERENCES public.patients(id);


--
-- Name: patient_additional_data patient_additional_data_health_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_health_center_id_fkey FOREIGN KEY (health_center_id) REFERENCES public.facilities(id);


--
-- Name: patient_additional_data patient_additional_data_insurer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_medical_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_medical_area_id_fkey FOREIGN KEY (medical_area_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_mother_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_mother_id_fkey FOREIGN KEY (mother_id) REFERENCES public.patients(id);


--
-- Name: patient_additional_data patient_additional_data_nationality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_nationality_id_fkey FOREIGN KEY (nationality_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_nursing_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_nursing_zone_id_fkey FOREIGN KEY (nursing_zone_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_occupation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_occupation_id_fkey FOREIGN KEY (occupation_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_patient_billing_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_patient_billing_type_id_fkey FOREIGN KEY (patient_billing_type_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_additional_data patient_additional_data_registered_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_registered_by_id_fkey FOREIGN KEY (registered_by_id) REFERENCES public.users(id);


--
-- Name: patient_additional_data patient_additional_data_religion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_religion_id_fkey FOREIGN KEY (religion_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_secondary_village_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_secondary_village_id_fkey FOREIGN KEY (secondary_village_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.reference_data(id);


--
-- Name: patient_additional_data patient_additional_data_subdivision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_additional_data
    ADD CONSTRAINT patient_additional_data_subdivision_id_fkey FOREIGN KEY (subdivision_id) REFERENCES public.reference_data(id);


--
-- Name: patient_allergies patient_allergies_allergy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_allergy_id_fkey FOREIGN KEY (allergy_id) REFERENCES public.reference_data(id);


--
-- Name: patient_allergies patient_allergies_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_allergies patient_allergies_practitioner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.users(id);


--
-- Name: patient_allergies patient_allergies_reaction_id_reference_data_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_reaction_id_reference_data_fk FOREIGN KEY (reaction_id) REFERENCES public.reference_data(id);


--
-- Name: patient_birth_data patient_birth_data_birth_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_birth_data
    ADD CONSTRAINT patient_birth_data_birth_facility_id_fkey FOREIGN KEY (birth_facility_id) REFERENCES public.facilities(id);


--
-- Name: patient_birth_data patient_birth_data_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_birth_data
    ADD CONSTRAINT patient_birth_data_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_care_plans patient_care_plans_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_care_plans
    ADD CONSTRAINT patient_care_plans_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.reference_data(id);


--
-- Name: patient_care_plans patient_care_plans_examiner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_care_plans
    ADD CONSTRAINT patient_care_plans_examiner_id_fkey FOREIGN KEY (examiner_id) REFERENCES public.users(id);


--
-- Name: patient_care_plans patient_care_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_care_plans
    ADD CONSTRAINT patient_care_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_communications patient_communications_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_communications
    ADD CONSTRAINT patient_communications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_conditions patient_conditions_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_conditions
    ADD CONSTRAINT patient_conditions_condition_id_fkey FOREIGN KEY (condition_id) REFERENCES public.reference_data(id);


--
-- Name: patient_conditions patient_conditions_examiner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_conditions
    ADD CONSTRAINT patient_conditions_examiner_id_fkey FOREIGN KEY (examiner_id) REFERENCES public.users(id);


--
-- Name: patient_conditions patient_conditions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_conditions
    ADD CONSTRAINT patient_conditions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_conditions patient_conditions_resolution_practitioner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_conditions
    ADD CONSTRAINT patient_conditions_resolution_practitioner_id_fkey FOREIGN KEY (resolution_practitioner_id) REFERENCES public.users(id);


--
-- Name: patient_contacts patient_contacts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_contacts
    ADD CONSTRAINT patient_contacts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_contacts patient_contacts_relationship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_contacts
    ADD CONSTRAINT patient_contacts_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.reference_data(id);


--
-- Name: patient_death_data patient_death_data_antecedent_cause1_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_antecedent_cause1_condition_id_fkey FOREIGN KEY (antecedent_cause1_condition_id) REFERENCES public.reference_data(id);


--
-- Name: patient_death_data patient_death_data_antecedent_cause2_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_antecedent_cause2_condition_id_fkey FOREIGN KEY (antecedent_cause2_condition_id) REFERENCES public.reference_data(id);


--
-- Name: patient_death_data patient_death_data_antecedent_cause3_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_antecedent_cause3_condition_id_fkey FOREIGN KEY (antecedent_cause3_condition_id) REFERENCES public.reference_data(id);


--
-- Name: patient_death_data patient_death_data_carrier_existing_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_carrier_existing_condition_id_fkey FOREIGN KEY (carrier_existing_condition_id) REFERENCES public.reference_data(id);


--
-- Name: patient_death_data patient_death_data_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: patient_death_data patient_death_data_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: patient_death_data patient_death_data_last_surgery_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_last_surgery_reason_id_fkey FOREIGN KEY (last_surgery_reason_id) REFERENCES public.reference_data(id);


--
-- Name: patient_death_data patient_death_data_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_death_data patient_death_data_primary_cause_condition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_death_data
    ADD CONSTRAINT patient_death_data_primary_cause_condition_id_fkey FOREIGN KEY (primary_cause_condition_id) REFERENCES public.reference_data(id);


--
-- Name: patient_facilities patient_facilities_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_facilities
    ADD CONSTRAINT patient_facilities_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: patient_facilities patient_facilities_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_facilities
    ADD CONSTRAINT patient_facilities_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_family_histories patient_family_histories_diagnosis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_family_histories
    ADD CONSTRAINT patient_family_histories_diagnosis_id_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.reference_data(id);


--
-- Name: patient_family_histories patient_family_histories_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_family_histories
    ADD CONSTRAINT patient_family_histories_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_family_histories patient_family_histories_practitioner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_family_histories
    ADD CONSTRAINT patient_family_histories_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.users(id);


--
-- Name: patient_field_definitions patient_field_definitions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_field_definitions
    ADD CONSTRAINT patient_field_definitions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.patient_field_definition_categories(id);


--
-- Name: patient_field_values patient_field_values_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_field_values
    ADD CONSTRAINT patient_field_values_definition_id_fkey FOREIGN KEY (definition_id) REFERENCES public.patient_field_definitions(id);


--
-- Name: patient_field_values patient_field_values_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_field_values
    ADD CONSTRAINT patient_field_values_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_issues patient_issues_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_issues
    ADD CONSTRAINT patient_issues_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: templates patient_letter_templates_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT patient_letter_templates_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: patient_ongoing_prescriptions patient_ongoing_prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_ongoing_prescriptions
    ADD CONSTRAINT patient_ongoing_prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_ongoing_prescriptions patient_ongoing_prescriptions_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_ongoing_prescriptions
    ADD CONSTRAINT patient_ongoing_prescriptions_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);


--
-- Name: patient_program_registration_conditions patient_program_registration__patient_program_registration_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registration_conditions
    ADD CONSTRAINT patient_program_registration__patient_program_registration_fkey FOREIGN KEY (patient_program_registration_id) REFERENCES public.patient_program_registrations(id) ON DELETE CASCADE;


--
-- Name: patient_program_registration_conditions patient_program_registration__program_registry_condition_c_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registration_conditions
    ADD CONSTRAINT patient_program_registration__program_registry_condition_c_fkey FOREIGN KEY (program_registry_condition_category_id) REFERENCES public.program_registry_condition_categories(id);


--
-- Name: patient_program_registration_conditions patient_program_registration_conditions_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registration_conditions
    ADD CONSTRAINT patient_program_registration_conditions_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: patient_program_registration_conditions patient_program_registration_conditions_deletion_clinician_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registration_conditions
    ADD CONSTRAINT patient_program_registration_conditions_deletion_clinician_id_f FOREIGN KEY (deletion_clinician_id) REFERENCES public.users(id);


--
-- Name: patient_program_registration_conditions patient_program_registration_conditions_program_registry_condit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registration_conditions
    ADD CONSTRAINT patient_program_registration_conditions_program_registry_condit FOREIGN KEY (program_registry_condition_id) REFERENCES public.program_registry_conditions(id);


--
-- Name: patient_program_registrations patient_program_registrations_clinical_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_clinical_status_id_fkey FOREIGN KEY (clinical_status_id) REFERENCES public.program_registry_clinical_statuses(id);


--
-- Name: patient_program_registrations patient_program_registrations_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: patient_program_registrations patient_program_registrations_deactivated_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_deactivated_clinician_id_fkey FOREIGN KEY (deactivated_clinician_id) REFERENCES public.users(id);


--
-- Name: patient_program_registrations patient_program_registrations_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: patient_program_registrations patient_program_registrations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_program_registrations patient_program_registrations_program_registry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_program_registry_id_fkey FOREIGN KEY (program_registry_id) REFERENCES public.program_registries(id);


--
-- Name: patient_program_registrations patient_program_registrations_registering_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_registering_facility_id_fkey FOREIGN KEY (registering_facility_id) REFERENCES public.facilities(id);


--
-- Name: patient_program_registrations patient_program_registrations_village_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_program_registrations
    ADD CONSTRAINT patient_program_registrations_village_id_fkey FOREIGN KEY (village_id) REFERENCES public.reference_data(id);


--
-- Name: patient_secondary_ids patient_secondary_ids_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_secondary_ids
    ADD CONSTRAINT patient_secondary_ids_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_secondary_ids patient_secondary_ids_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_secondary_ids
    ADD CONSTRAINT patient_secondary_ids_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.reference_data(id);


--
-- Name: patient_vrs_data patient_vrs_data_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_vrs_data
    ADD CONSTRAINT patient_vrs_data_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patients patients_village_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_village_id_fkey FOREIGN KEY (village_id) REFERENCES public.reference_data(id);


--
-- Name: permissions permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: pharmacy_order_prescriptions pharmacy_order_prescriptions_pharmacy_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_order_prescriptions
    ADD CONSTRAINT pharmacy_order_prescriptions_pharmacy_order_id_fkey FOREIGN KEY (pharmacy_order_id) REFERENCES public.pharmacy_orders(id);


--
-- Name: pharmacy_order_prescriptions pharmacy_order_prescriptions_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_order_prescriptions
    ADD CONSTRAINT pharmacy_order_prescriptions_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);


--
-- Name: pharmacy_orders pharmacy_orders_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: pharmacy_orders pharmacy_orders_ordering_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_ordering_clinician_id_fkey FOREIGN KEY (ordering_clinician_id) REFERENCES public.users(id);


--
-- Name: portal_one_time_tokens portal_one_time_tokens_portal_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_one_time_tokens
    ADD CONSTRAINT portal_one_time_tokens_portal_user_id_fkey FOREIGN KEY (portal_user_id) REFERENCES public.portal_users(id) ON DELETE CASCADE;


--
-- Name: portal_survey_assignments portal_survey_assignments_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_survey_assignments
    ADD CONSTRAINT portal_survey_assignments_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(id);


--
-- Name: portal_survey_assignments portal_survey_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_survey_assignments
    ADD CONSTRAINT portal_survey_assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: portal_survey_assignments portal_survey_assignments_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_survey_assignments
    ADD CONSTRAINT portal_survey_assignments_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id);


--
-- Name: portal_survey_assignments portal_survey_assignments_survey_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_survey_assignments
    ADD CONSTRAINT portal_survey_assignments_survey_response_id_fkey FOREIGN KEY (survey_response_id) REFERENCES public.survey_responses(id);


--
-- Name: portal_users portal_users_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_users
    ADD CONSTRAINT portal_users_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: procedure_assistant_clinicians procedure_assistant_clinicians_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_assistant_clinicians
    ADD CONSTRAINT procedure_assistant_clinicians_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id);


--
-- Name: procedure_assistant_clinicians procedure_assistant_clinicians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_assistant_clinicians
    ADD CONSTRAINT procedure_assistant_clinicians_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: procedure_survey_responses procedure_survey_responses_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_survey_responses
    ADD CONSTRAINT procedure_survey_responses_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedure_survey_responses procedure_survey_responses_survey_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_survey_responses
    ADD CONSTRAINT procedure_survey_responses_survey_response_id_fkey FOREIGN KEY (survey_response_id) REFERENCES public.survey_responses(id) ON DELETE CASCADE;


--
-- Name: procedure_type_surveys procedure_type_surveys_procedure_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_type_surveys
    ADD CONSTRAINT procedure_type_surveys_procedure_type_id_fkey FOREIGN KEY (procedure_type_id) REFERENCES public.reference_data(id);


--
-- Name: procedure_type_surveys procedure_type_surveys_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_type_surveys
    ADD CONSTRAINT procedure_type_surveys_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id);


--
-- Name: procedures procedures_anaesthetic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_anaesthetic_id_fkey FOREIGN KEY (anaesthetic_id) REFERENCES public.reference_data(id);


--
-- Name: procedures procedures_anaesthetist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_anaesthetist_id_fkey FOREIGN KEY (anaesthetist_id) REFERENCES public.users(id);


--
-- Name: procedures procedures_assistant_anaesthetist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_assistant_anaesthetist_id_fkey FOREIGN KEY (assistant_anaesthetist_id) REFERENCES public.users(id);


--
-- Name: procedures procedures_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: procedures procedures_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: procedures procedures_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: procedures procedures_physician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_physician_id_fkey FOREIGN KEY (physician_id) REFERENCES public.users(id);


--
-- Name: procedures procedures_procedure_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_procedure_type_id_fkey FOREIGN KEY (procedure_type_id) REFERENCES public.reference_data(id);


--
-- Name: program_registries program_registries_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registries
    ADD CONSTRAINT program_registries_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);


--
-- Name: program_registry_clinical_statuses program_registry_clinical_statuses_program_registry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_clinical_statuses
    ADD CONSTRAINT program_registry_clinical_statuses_program_registry_id_fkey FOREIGN KEY (program_registry_id) REFERENCES public.program_registries(id);


--
-- Name: program_registry_condition_categories program_registry_condition_categories_program_registry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_condition_categories
    ADD CONSTRAINT program_registry_condition_categories_program_registry_id_fkey FOREIGN KEY (program_registry_id) REFERENCES public.program_registries(id);


--
-- Name: program_registry_conditions program_registry_conditions_program_registry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_registry_conditions
    ADD CONSTRAINT program_registry_conditions_program_registry_id_fkey FOREIGN KEY (program_registry_id) REFERENCES public.program_registries(id);


--
-- Name: reference_data_relations reference_data_relations_reference_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_data_relations
    ADD CONSTRAINT reference_data_relations_reference_data_id_fkey FOREIGN KEY (reference_data_id) REFERENCES public.reference_data(id);


--
-- Name: reference_data_relations reference_data_relations_reference_data_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_data_relations
    ADD CONSTRAINT reference_data_relations_reference_data_parent_id_fkey FOREIGN KEY (reference_data_parent_id) REFERENCES public.reference_data(id);


--
-- Name: reference_drugs reference_drugs_reference_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_drugs
    ADD CONSTRAINT reference_drugs_reference_data_id_fkey FOREIGN KEY (reference_data_id) REFERENCES public.reference_data(id);


--
-- Name: reference_medication_templates reference_medication_templates_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_medication_templates
    ADD CONSTRAINT reference_medication_templates_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.reference_data(id);


--
-- Name: reference_medication_templates reference_medication_templates_reference_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_medication_templates
    ADD CONSTRAINT reference_medication_templates_reference_data_id_fkey FOREIGN KEY (reference_data_id) REFERENCES public.reference_data(id);


--
-- Name: referrals referrals_completing_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_completing_encounter_id_fkey FOREIGN KEY (completing_encounter_id) REFERENCES public.encounters(id);


--
-- Name: referrals referrals_initiating_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_initiating_encounter_id_fkey FOREIGN KEY (initiating_encounter_id) REFERENCES public.encounters(id);


--
-- Name: referrals referrals_survey_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_survey_response_id_fkey FOREIGN KEY (survey_response_id) REFERENCES public.survey_responses(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: report_definition_versions report_definition_versions_report_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_definition_versions
    ADD CONSTRAINT report_definition_versions_report_definition_id_fkey FOREIGN KEY (report_definition_id) REFERENCES public.report_definitions(id);


--
-- Name: report_definition_versions report_definition_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_definition_versions
    ADD CONSTRAINT report_definition_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: report_requests report_requests_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_requests
    ADD CONSTRAINT report_requests_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: report_requests report_requests_report_definition_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_requests
    ADD CONSTRAINT report_requests_report_definition_version_id_fkey FOREIGN KEY (report_definition_version_id) REFERENCES public.report_definition_versions(id);


--
-- Name: report_requests report_requests_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_requests
    ADD CONSTRAINT report_requests_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: scheduled_vaccines scheduled_vaccines_vaccine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_vaccines
    ADD CONSTRAINT scheduled_vaccines_vaccine_id_fkey FOREIGN KEY (vaccine_id) REFERENCES public.reference_data(id);


--
-- Name: settings settings_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: survey_response_answers survey_response_answers_data_element_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_response_answers
    ADD CONSTRAINT survey_response_answers_data_element_id_fkey FOREIGN KEY (data_element_id) REFERENCES public.program_data_elements(id);


--
-- Name: survey_response_answers survey_response_answers_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_response_answers
    ADD CONSTRAINT survey_response_answers_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.survey_responses(id);


--
-- Name: survey_responses survey_responses_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: survey_responses survey_responses_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id);


--
-- Name: survey_responses survey_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: survey_screen_components survey_screen_components_data_element_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_screen_components
    ADD CONSTRAINT survey_screen_components_data_element_id_fkey FOREIGN KEY (data_element_id) REFERENCES public.program_data_elements(id);


--
-- Name: survey_screen_components survey_screen_components_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_screen_components
    ADD CONSTRAINT survey_screen_components_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id);


--
-- Name: surveys surveys_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);


--
-- Name: sync_queued_devices sync_queued_devices_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queued_devices
    ADD CONSTRAINT sync_queued_devices_facility_id_fkey FOREIGN KEY (facility_id_legacy) REFERENCES public.facilities(id);


--
-- Name: task_designations task_designations_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_designations
    ADD CONSTRAINT task_designations_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.reference_data(id);


--
-- Name: task_designations task_designations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_designations
    ADD CONSTRAINT task_designations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_template_designations task_template_designations_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_designations
    ADD CONSTRAINT task_template_designations_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.reference_data(id);


--
-- Name: task_template_designations task_template_designations_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_designations
    ADD CONSTRAINT task_template_designations_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id);


--
-- Name: task_templates task_templates_reference_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_reference_data_id_fkey FOREIGN KEY (reference_data_id) REFERENCES public.reference_data(id);


--
-- Name: tasks tasks_completed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_completed_by_user_id_fkey FOREIGN KEY (completed_by_user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_deleted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_deleted_by_user_id_fkey FOREIGN KEY (deleted_by_user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_deleted_reason_for_sync_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_deleted_reason_for_sync_id_fkey FOREIGN KEY (deleted_reason_for_sync_id) REFERENCES public.reference_data(id);


--
-- Name: tasks tasks_deleted_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_deleted_reason_id_fkey FOREIGN KEY (deleted_reason_id) REFERENCES public.reference_data(id);


--
-- Name: tasks tasks_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: tasks tasks_not_completed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_not_completed_by_user_id_fkey FOREIGN KEY (not_completed_by_user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_not_completed_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_not_completed_reason_id_fkey FOREIGN KEY (not_completed_reason_id) REFERENCES public.reference_data(id);


--
-- Name: tasks tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id);


--
-- Name: tasks tasks_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_todo_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_todo_by_user_id_fkey FOREIGN KEY (todo_by_user_id) REFERENCES public.users(id);


--
-- Name: triages triages_arrival_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triages
    ADD CONSTRAINT triages_arrival_mode_id_fkey FOREIGN KEY (arrival_mode_id) REFERENCES public.reference_data(id);


--
-- Name: triages triages_chief_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triages
    ADD CONSTRAINT triages_chief_complaint_id_fkey FOREIGN KEY (chief_complaint_id) REFERENCES public.reference_data(id);


--
-- Name: triages triages_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triages
    ADD CONSTRAINT triages_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: triages triages_practitioner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triages
    ADD CONSTRAINT triages_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.users(id);


--
-- Name: triages triages_secondary_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triages
    ADD CONSTRAINT triages_secondary_complaint_id_fkey FOREIGN KEY (secondary_complaint_id) REFERENCES public.reference_data(id);


--
-- Name: user_designations user_designations_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_designations
    ADD CONSTRAINT user_designations_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.reference_data(id);


--
-- Name: user_designations user_designations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_designations
    ADD CONSTRAINT user_designations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_facilities user_facilities_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_facilities
    ADD CONSTRAINT user_facilities_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_facilities user_facilities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_facilities
    ADD CONSTRAINT user_facilities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_localisation_caches user_feature_flags_caches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_localisation_caches
    ADD CONSTRAINT user_feature_flags_caches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_preferences user_preferences_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_recently_viewed_patients user_recently_viewed_patients_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recently_viewed_patients
    ADD CONSTRAINT user_recently_viewed_patients_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: user_recently_viewed_patients user_recently_viewed_patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recently_viewed_patients
    ADD CONSTRAINT user_recently_viewed_patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vital_logs vital_logs_answer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_logs
    ADD CONSTRAINT vital_logs_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.survey_response_answers(id);


--
-- Name: vital_logs vital_logs_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_logs
    ADD CONSTRAINT vital_logs_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id);


--
-- Name: vitals vitals_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: vitals vitals_migrated_record_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_migrated_record_fkey FOREIGN KEY (migrated_record) REFERENCES public.survey_responses(id);


--
-- PostgreSQL database dump complete
--

