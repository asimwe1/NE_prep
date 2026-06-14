--
-- PostgreSQL database dump
--

\restrict DW9ygIMfnQU1ZPYigHuusKfMiGQQugSXAavglTKD3ounZfcWUSwA9Ak0vnaavti

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    user_email character varying(255),
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_code character varying(20) NOT NULL,
    full_name character varying(200) NOT NULL,
    national_id character varying(50),
    phone character varying(30) NOT NULL,
    email character varying(255),
    address text,
    organization_name character varying(200),
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: escalations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.escalations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    extinguisher_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    stage integer NOT NULL,
    reason text NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT escalations_stage_check CHECK (((stage >= 1) AND (stage <= 5))),
    CONSTRAINT escalations_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'acknowledged'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.escalations OWNER TO postgres;

--
-- Name: extinguishers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extinguishers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    extinguisher_code character varying(30) NOT NULL,
    serial_number character varying(100) NOT NULL,
    type character varying(30) NOT NULL,
    size character varying(20) NOT NULL,
    capacity_liters numeric(8,2),
    manufacture_date date NOT NULL,
    purchase_date date NOT NULL,
    installation_date date NOT NULL,
    expiry_date date NOT NULL,
    last_inspection_date date,
    next_inspection_date date,
    location character varying(300) NOT NULL,
    customer_id uuid NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying,
    compliance_status character varying(30) DEFAULT 'compliant'::character varying,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT extinguishers_compliance_status_check CHECK (((compliance_status)::text = ANY ((ARRAY['compliant'::character varying, 'non_compliant'::character varying, 'warning'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT extinguishers_size_check CHECK (((size)::text = ANY ((ARRAY['1.5 lb'::character varying, '5 lb'::character varying, '9 lb'::character varying, '12 lb'::character varying])::text[]))),
    CONSTRAINT extinguishers_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'serviced'::character varying, 'decommissioned'::character varying, 'pending_inspection'::character varying])::text[]))),
    CONSTRAINT extinguishers_type_check CHECK (((type)::text = ANY ((ARRAY['Water'::character varying, 'CO2'::character varying, 'Foam'::character varying, 'Dry Chemical'::character varying])::text[])))
);


ALTER TABLE public.extinguishers OWNER TO postgres;

--
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    extinguisher_id uuid NOT NULL,
    inspector_id uuid,
    inspector_name character varying(200) NOT NULL,
    inspection_date date NOT NULL,
    inspection_time time without time zone,
    findings text,
    status character varying(30) NOT NULL,
    next_inspection_date date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inspections_status_check CHECK (((status)::text = ANY ((ARRAY['Scheduled'::character varying, 'Completed'::character varying, 'Requires Service'::character varying, 'Failed'::character varying])::text[])))
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- Name: maintenance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    extinguisher_id uuid NOT NULL,
    service_date date NOT NULL,
    service_company character varying(200) NOT NULL,
    technician_name character varying(200) NOT NULL,
    action_taken character varying(255),
    issues_identified text,
    recommendations text,
    next_service_date date,
    cost numeric(12,2) DEFAULT 0.00,
    description text,
    status character varying(30) DEFAULT 'completed'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maintenance_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.maintenance OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    extinguisher_id uuid,
    user_id uuid,
    type character varying(50) NOT NULL,
    title character varying(300) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    days_until_expiry integer,
    escalation_stage integer DEFAULT 0,
    recipient_email character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['expiry_alert'::character varying, 'inspection_due'::character varying, 'service_due'::character varying, 'compliance_violation'::character varying, 'escalation'::character varying, 'general'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    purpose character varying(30) DEFAULT 'password_reset'::character varying NOT NULL,
    is_used boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT otps_purpose_check CHECK (((purpose)::text = ANY ((ARRAY['password_reset'::character varying, 'email_verify'::character varying])::text[])))
);


ALTER TABLE public.otps OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'inspector'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_email, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
40479123-a1d7-4338-aac9-c956cb5c2de6	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 09:50:01.718295+02
c261284c-6b5c-4887-b654-77eb68e2154c	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 10:01:50.310855+02
46c34c55-48bd-4103-a1bb-ec60e6eca49f	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 10:04:38.456384+02
abc7d968-97df-48ee-8ea7-f257805444d0	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 10:07:10.414283+02
1b92762d-6b2d-458d-a4e2-6ee3699aa524	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	REGISTER	user	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	\N	\N	\N	\N	2026-06-03 10:18:45.100982+02
8dbdf449-32cc-458c-999a-0f5b0d87fa58	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	CREATE_INSPECTION	inspection	c551b77b-0cd9-402e-8445-323cd0d68100	\N	{"status": "Scheduled", "findings": "", "inspectorName": "Asimwe Landry", "extinguisherId": "66666666-6666-6666-6666-666666666666", "inspectionDate": "2026-06-03T00:00:00.000Z", "inspectionTime": "10:25", "nextInspectionDate": ""}	\N	\N	2026-06-03 10:23:30.09482+02
31253824-8216-452e-afda-1c7d9029aeb6	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 10:25:48.17181+02
e0a6b0b5-7912-46af-b815-8fecdfba6377	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	PASSWORD_RESET	user	\N	\N	\N	::1	\N	2026-06-03 10:28:55.411649+02
6d2b5ea3-b675-402b-afb7-e8b7258ff318	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 10:28:59.013398+02
e86df308-e4ee-41cf-ae2e-8d679fa34757	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 10:41:15.357982+02
47233218-cb52-498d-8f7c-8a2fbc30b378	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 11:24:16.035845+02
355dc252-1799-4c56-987a-7202116e5abc	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 11:32:08.053803+02
c4cfe24e-6cbf-4b6b-8314-6d1eb0a4f984	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 12:06:06.110157+02
7ebd9d3d-b003-4971-b68f-a0db5e75049d	11111111-1111-1111-1111-111111111111	admin@femcs.rw	DELETE_EXTINGUISHER	extinguisher	77777777-7777-7777-7777-777777777777	{"id": "77777777-7777-7777-7777-777777777777", "size": "9 lb", "type": "Dry Chemical", "notes": "Pending follow-up inspection after routine service.", "status": "pending_inspection", "location": "Warehouse A Loading Bay", "created_at": "2026-06-03T07:48:58.164Z", "created_by": "11111111-1111-1111-1111-111111111111", "updated_at": "2026-06-03T07:48:58.164Z", "customer_id": "55555555-5555-5555-5555-555555555555", "expiry_date": "2028-04-06T22:00:00.000Z", "purchase_date": "2024-03-31T22:00:00.000Z", "serial_number": "SN-DC-2024-100002", "capacity_liters": "4.10", "manufacture_date": "2024-03-19T22:00:00.000Z", "compliance_status": "warning", "extinguisher_code": "EXT-100002", "installation_date": "2024-04-06T22:00:00.000Z", "last_inspection_date": "2025-12-14T22:00:00.000Z", "next_inspection_date": "2026-06-19T22:00:00.000Z"}	\N	\N	\N	2026-06-03 12:20:52.006504+02
b3a993ce-42ae-46b6-94bd-665e10f899f1	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 12:31:51.810548+02
f6d4ec8d-10e4-4924-a427-8e5d2490ad1e	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	UPDATE_MAINTENANCE	maintenance	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2	{"id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", "cost": "0.00", "status": "scheduled", "created_at": "2026-06-03T07:48:58.165Z", "created_by": "11111111-1111-1111-1111-111111111111", "updated_at": "2026-06-03T07:48:58.165Z", "description": "Assessment generated for expired extinguisher.", "action_taken": "Assessment only.", "service_date": "2026-06-04T22:00:00.000Z", "extinguisher_id": "88888888-8888-8888-8888-888888888888", "recommendations": "Decommission and replace immediately.", "service_company": "SafeSpark Services", "technician_name": "David Tech", "issues_identified": "Unit is expired and due for replacement.", "next_service_date": "2026-06-11T22:00:00.000Z"}	{"cost": 1000, "status": "scheduled", "actionTaken": "Assessment only.", "description": "Assessment generated for expired extinguisher.", "serviceDate": "2026-06-04T00:00:00.000Z", "extinguisherId": "88888888-8888-8888-8888-888888888888", "serviceCompany": "SafeSpark Services", "technicianName": "David Tech", "nextServiceDate": "2026-06-11T00:00:00.000Z", "recommendations": "Decommission and replace immediately.", "issuesIdentified": "Unit is expired and due for replacement."}	\N	\N	2026-06-03 13:07:23.186903+02
57436c8c-4bb5-4bb3-96db-410630f69a37	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 13:09:35.709665+02
ceab3874-3b1f-4c79-b275-b3505ad54b70	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 13:09:47.952423+02
1b1033bd-0104-4152-89f9-cb51c68e87c3	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 13:10:22.53092+02
26cb2b9b-a988-45a3-bf4a-d8bd5f10e594	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 13:10:41.778411+02
c9d77910-25a4-42d1-b2d4-43a6786e4579	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 13:11:03.81458+02
a2a662b3-250c-4520-9548-e058194033f1	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 13:11:19.370292+02
2919dfaa-a717-40ea-8976-46fd774486db	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 13:16:36.989812+02
27716868-3c08-4ec7-8ec0-7b43899c8774	5103c632-bb90-4367-9e7b-8c6458e038e6	landryasimwe@gmail.com	REGISTER	user	5103c632-bb90-4367-9e7b-8c6458e038e6	\N	\N	\N	\N	2026-06-03 13:17:14.273061+02
e49dd3fc-ba64-40ef-ad6b-9512ccca34ca	5103c632-bb90-4367-9e7b-8c6458e038e6	landryasimwe@gmail.com	CREATE_EXTINGUISHER	extinguisher	980575cb-0532-477e-9817-ef3aa62e1deb	\N	{"size": "5 lb", "type": "CO2", "notes": "", "status": "active", "location": "Kigali", "customerId": "44444444-4444-4444-4444-444444444444", "expiryDate": "2027-06-03T00:00:00.000Z", "purchaseDate": "2026-06-02T00:00:00.000Z", "serialNumber": "SN-CO2-2026-100001", "capacityLiters": null, "manufactureDate": "2025-01-03T00:00:00.000Z", "installationDate": "2026-06-02T00:00:00.000Z", "lastInspectionDate": "", "nextInspectionDate": "2027-06-02T00:00:00.000Z"}	\N	\N	2026-06-03 13:20:38.033037+02
29b75d71-bdda-4968-ae8d-35193fe9595f	5103c632-bb90-4367-9e7b-8c6458e038e6	landryasimwe@gmail.com	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-03 13:22:46.742882+02
5d6586fb-daf2-4430-a59d-c245e0a47669	5103c632-bb90-4367-9e7b-8c6458e038e6	landryasimwe@gmail.com	LOGIN	user	\N	\N	\N	::1	\N	2026-06-03 13:32:17.394778+02
47886b1d-1322-48cb-afc9-d6a09e18214e	5103c632-bb90-4367-9e7b-8c6458e038e6	landryasimwe@gmail.com	CREATE_INSPECTION	inspection	bede67ae-5e8b-4968-8f50-1c7c44f5267b	\N	{"status": "Scheduled", "findings": "", "inspectorId": "5b8a5c94-59a7-4e22-9034-f7f7547bfc3e", "extinguisherId": "980575cb-0532-477e-9817-ef3aa62e1deb", "inspectionDate": "2026-06-03T00:00:00.000Z", "inspectionTime": "13:35", "nextInspectionDate": ""}	\N	\N	2026-06-03 13:33:05.333291+02
62632f9e-3221-4ab6-aeb3-d69032a133d5	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGIN	user	\N	\N	\N	::1	\N	2026-06-04 10:30:05.715251+02
2a629391-803e-4055-b608-59a1394ae8a8	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-04 10:30:17.040309+02
50f93d43-4e4d-43b9-9715-21cc8ce74a4c	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGIN	user	\N	\N	\N	::1	\N	2026-06-04 10:31:13.950872+02
16749f39-09c0-4b31-b790-a0e220908fce	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-04 10:32:04.546481+02
213189de-035e-44a4-9af8-32330ee172fe	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-04 10:32:11.534073+02
929f47d4-a05f-4eb5-8279-b0911ff4aef2	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-04 10:32:43.760911+02
23bd027c-f7c4-4329-8951-3c1c900f7f7b	a5779455-ae49-42b8-9b86-81b7095bb1a6	example@femcs.rw	REGISTER	user	a5779455-ae49-42b8-9b86-81b7095bb1a6	\N	\N	\N	\N	2026-06-04 10:35:36.787175+02
255479d1-1b09-4df0-a867-9ab6aa766ce4	a5779455-ae49-42b8-9b86-81b7095bb1a6	example@femcs.rw	CREATE_INSPECTION	inspection	41d0fb48-9fb6-4f90-b78d-4c24b9f85e15	\N	{"status": "Scheduled", "findings": "", "inspectorId": "5b8a5c94-59a7-4e22-9034-f7f7547bfc3e", "extinguisherId": "66666666-6666-6666-6666-666666666666", "inspectionDate": "2026-06-04T00:00:00.000Z", "inspectionTime": "10:40", "nextInspectionDate": ""}	\N	\N	2026-06-04 10:36:27.125469+02
8f0959b6-0493-4c20-8bf0-021e7c9120c5	a5779455-ae49-42b8-9b86-81b7095bb1a6	example@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-04 10:36:44.596406+02
70c48a49-abc1-4aa9-9199-13ef4d55a035	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGIN	user	\N	\N	\N	::1	\N	2026-06-04 10:36:48.296205+02
31a3446e-53f2-4e43-a5f9-d50d2b9dc6cb	11111111-1111-1111-1111-111111111111	admin@femcs.rw	CREATE_EXTINGUISHER	extinguisher	cbe6315d-8a61-4153-9409-1cb3dfbd2b49	\N	{"size": "5 lb", "type": "Foam", "notes": "New ext in musanze", "status": "active", "location": "Musanze", "customerId": "44444444-4444-4444-4444-444444444444", "expiryDate": "2027-06-04T00:00:00.000Z", "purchaseDate": "2026-06-03T00:00:00.000Z", "serialNumber": "SN-CO2-2026-100002", "capacityLiters": null, "manufactureDate": "2025-02-04T00:00:00.000Z", "installationDate": "2026-06-03T00:00:00.000Z", "lastInspectionDate": "2026-06-03T00:00:00.000Z", "nextInspectionDate": "2027-05-04T00:00:00.000Z"}	\N	\N	2026-06-04 10:38:39.840591+02
57576ca6-4560-47b6-9a4b-a408c3863eab	11111111-1111-1111-1111-111111111111	admin@femcs.rw	LOGOUT	user	\N	\N	\N	::1	\N	2026-06-04 10:55:56.186743+02
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, customer_code, full_name, national_id, phone, email, address, organization_name, is_active, created_by, created_at, updated_at) FROM stdin;
44444444-4444-4444-4444-444444444444	CUST-100001	North Block Facility Manager	1199980012345678	+250788000111	north.block@femcs.rw	North Block, Kigali Industrial Zone	North Block Industries	t	11111111-1111-1111-1111-111111111111	2026-06-03 09:48:58.163523+02	2026-06-03 09:48:58.163523+02
55555555-5555-5555-5555-555555555555	CUST-100002	Warehouse Safety Desk	1199980098765432	+250788000222	warehouse.safety@femcs.rw	Warehouse Park, Kigali Logistics Hub	Warehouse Operations Ltd	t	11111111-1111-1111-1111-111111111111	2026-06-03 09:48:58.163523+02	2026-06-03 09:48:58.163523+02
\.


--
-- Data for Name: escalations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.escalations (id, extinguisher_id, customer_id, stage, reason, status, resolved_at, resolved_by, notes, created_at, updated_at) FROM stdin;
cccccccc-cccc-cccc-cccc-ccccccccccc1	88888888-8888-8888-8888-888888888888	55555555-5555-5555-5555-555555555555	1	Expired extinguisher detected during compliance review.	open	\N	\N	Open starter escalation for dashboard and notification testing.	2026-06-03 09:48:58.166321+02	2026-06-03 09:48:58.166321+02
\.


--
-- Data for Name: extinguishers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extinguishers (id, extinguisher_code, serial_number, type, size, capacity_liters, manufacture_date, purchase_date, installation_date, expiry_date, last_inspection_date, next_inspection_date, location, customer_id, status, compliance_status, notes, created_by, created_at, updated_at) FROM stdin;
66666666-6666-6666-6666-666666666666	EXT-100001	SN-CO2-2024-100001	CO2	5 lb	2.30	2024-01-15	2024-02-01	2024-02-05	2029-02-05	2026-05-15	2026-11-15	North Block Ground Floor Reception	44444444-4444-4444-4444-444444444444	active	compliant	Starter compliant extinguisher for dashboard demos.	11111111-1111-1111-1111-111111111111	2026-06-03 09:48:58.164233+02	2026-06-03 09:48:58.164233+02
88888888-8888-8888-8888-888888888888	EXT-100003	SN-WTR-2020-100003	Water	12 lb	6.00	2020-01-10	2020-02-01	2020-02-10	2025-12-31	2025-12-01	2026-01-05	Warehouse B Chemical Storage Corridor	55555555-5555-5555-5555-555555555555	expired	non_compliant	Expired unit kept as a sample for escalation and notification flows.	11111111-1111-1111-1111-111111111111	2026-06-03 09:48:58.164233+02	2026-06-03 09:48:58.164233+02
980575cb-0532-477e-9817-ef3aa62e1deb	EXT-492246	SN-CO2-2026-100001	CO2	5 lb	\N	2025-01-03	2026-06-02	2026-06-02	2027-06-03	\N	2027-06-02	Kigali	44444444-4444-4444-4444-444444444444	active	compliant	\N	5103c632-bb90-4367-9e7b-8c6458e038e6	2026-06-03 13:20:38.028209+02	2026-06-03 13:20:38.028209+02
cbe6315d-8a61-4153-9409-1cb3dfbd2b49	EXT-805854	SN-CO2-2026-100002	Foam	5 lb	\N	2025-02-04	2026-06-03	2026-06-03	2027-06-04	2026-06-03	2027-05-04	Musanze	44444444-4444-4444-4444-444444444444	active	compliant	New ext in musanze	11111111-1111-1111-1111-111111111111	2026-06-04 10:38:39.833429+02	2026-06-04 10:38:39.833429+02
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, extinguisher_id, inspector_id, inspector_name, inspection_date, inspection_time, findings, status, next_inspection_date, created_by, created_at, updated_at) FROM stdin;
99999999-9999-9999-9999-999999999991	66666666-6666-6666-6666-666666666666	22222222-2222-2222-2222-222222222222	Grace Inspector	2026-05-15	10:00:00	Pressure gauge normal, seal intact, and signage visible.	Completed	2026-11-15	11111111-1111-1111-1111-111111111111	2026-06-03 09:48:58.165013+02	2026-06-03 09:48:58.165013+02
c551b77b-0cd9-402e-8445-323cd0d68100	66666666-6666-6666-6666-666666666666	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	Asimwe Landry	2026-06-03	10:25:00	\N	Scheduled	\N	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	2026-06-03 10:23:30.082781+02	2026-06-03 10:23:30.082781+02
bede67ae-5e8b-4968-8f50-1c7c44f5267b	980575cb-0532-477e-9817-ef3aa62e1deb	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	Asimwe Landry	2026-06-03	13:35:00	\N	Scheduled	\N	5103c632-bb90-4367-9e7b-8c6458e038e6	2026-06-03 13:32:56.135952+02	2026-06-03 13:32:56.135952+02
41d0fb48-9fb6-4f90-b78d-4c24b9f85e15	66666666-6666-6666-6666-666666666666	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	Asimwe Landry	2026-06-04	10:40:00	\N	Scheduled	\N	a5779455-ae49-42b8-9b86-81b7095bb1a6	2026-06-04 10:36:27.06585+02	2026-06-04 10:36:27.06585+02
\.


--
-- Data for Name: maintenance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance (id, extinguisher_id, service_date, service_company, technician_name, action_taken, issues_identified, recommendations, next_service_date, cost, description, status, created_by, created_at, updated_at) FROM stdin;
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2	88888888-8888-8888-8888-888888888888	2026-06-04	SafeSpark Services	David Tech	Assessment only.	Unit is expired and due for replacement.	Decommission and replace immediately.	2026-06-11	1000.00	Assessment generated for expired extinguisher.	scheduled	11111111-1111-1111-1111-111111111111	2026-06-03 09:48:58.16549+02	2026-06-03 13:07:23.182263+02
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, customer_id, extinguisher_id, user_id, type, title, message, is_read, email_sent, email_sent_at, days_until_expiry, escalation_stage, recipient_email, created_at) FROM stdin;
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1	55555555-5555-5555-5555-555555555555	88888888-8888-8888-8888-888888888888	11111111-1111-1111-1111-111111111111	compliance_violation	Expired extinguisher requires replacement	EXT-100003 is expired and should be replaced before the next audit cycle.	t	f	\N	-10	1	admin@femcs.rw	2026-06-03 09:48:58.165924+02
aac57c19-08db-49bd-84c6-2cac5647e468	\N	980575cb-0532-477e-9817-ef3aa62e1deb	11111111-1111-1111-1111-111111111111	inspection_due	Inspection Scheduled: EXT-492246	Inspection for extinguisher EXT-492246 has been scheduled on 6/3/2026 at 13:35. Assigned inspector: Asimwe Landry.	f	t	2026-06-03 13:33:00.920018+02	\N	0	admin@femcs.rw	2026-06-03 13:32:56.143225+02
5e59bedd-5c3e-4841-96fc-625474fd5241	\N	980575cb-0532-477e-9817-ef3aa62e1deb	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	inspection_due	Inspection Scheduled: EXT-492246	Inspection for extinguisher EXT-492246 has been scheduled on 6/3/2026 at 13:35. Assigned inspector: Asimwe Landry.	f	t	2026-06-03 13:33:05.329632+02	\N	0	landrysb@neurolab.cc	2026-06-03 13:33:00.929534+02
d3bf0c50-be23-4a47-ad4d-aa90ae034a6b	\N	66666666-6666-6666-6666-666666666666	11111111-1111-1111-1111-111111111111	inspection_due	Inspection Scheduled: EXT-100001	Inspection for extinguisher EXT-100001 has been scheduled on 6/4/2026 at 10:40. Assigned inspector: Asimwe Landry.	f	f	\N	\N	0	admin@femcs.rw	2026-06-04 10:36:27.089688+02
c53a5951-0aae-467f-9567-f68026d74bc0	\N	66666666-6666-6666-6666-666666666666	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	inspection_due	Inspection Scheduled: EXT-100001	Inspection for extinguisher EXT-100001 has been scheduled on 6/4/2026 at 10:40. Assigned inspector: Asimwe Landry.	f	f	\N	\N	0	landrysb@neurolab.cc	2026-06-04 10:36:27.111148+02
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otps (id, user_id, email, code, purpose, is_used, expires_at, created_at) FROM stdin;
e09cfee4-61ad-4afb-87cb-e75b485fca94	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	830117	password_reset	t	2026-06-03 10:37:00.976+02	2026-06-03 10:27:00.979448+02
e0ece904-a087-489e-82c5-ca8ac629872b	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	603454	password_reset	t	2026-06-03 10:38:01.845+02	2026-06-03 10:28:01.852186+02
d0356be9-8e8c-4c38-bce8-f4c73533becc	5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	landrysb@neurolab.cc	242718	password_reset	f	2026-06-04 10:40:27.531+02	2026-06-04 10:30:27.536296+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, last_name, email, password, role, is_active, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	System	Admin	admin@femcs.rw	$2a$12$urR6RZtbMk.AVgPBZ2oxe.VUssoQyAHAVGMwKqJMKr5FJEOHQjiWC	admin	t	2026-06-03 09:48:27.195692+02	2026-06-03 09:48:58.152127+02
5b8a5c94-59a7-4e22-9034-f7f7547bfc3e	Asimwe	Landry	landrysb@neurolab.cc	$2a$12$eAmWr1Bq8lYYCfFmv2KG1.7r0WD.v7Eh19CWyVA.KHlm577QSm5lO	inspector	t	2026-06-03 10:18:45.091513+02	2026-06-03 10:28:55.406869+02
33333333-3333-3333-3333-333333333333	Client	User	user@femcs.rw	$2a$12$urR6RZtbMk.AVgPBZ2oxe.VUssoQyAHAVGMwKqJMKr5FJEOHQjiWC	user	f	2026-06-03 09:48:36.009911+02	2026-06-03 12:59:01.399462+02
5103c632-bb90-4367-9e7b-8c6458e038e6	Beni	Asifiwe	landryasimwe@gmail.com	$2a$12$nbzYfLD9QJ0r.Bnyv.4jeuPSWzfsA7N683U8ownLneXEAERBhv7Oy	user	t	2026-06-03 13:17:14.264819+02	2026-06-03 13:17:14.264819+02
22222222-2222-2222-2222-222222222222	Grace	Inspector	inspector@femcs.rw	$2a$12$urR6RZtbMk.AVgPBZ2oxe.VUssoQyAHAVGMwKqJMKr5FJEOHQjiWC	inspector	f	2026-06-03 09:48:36.009911+02	2026-06-04 10:32:23.864702+02
a5779455-ae49-42b8-9b86-81b7095bb1a6	Beni	Asifiwe	example@femcs.rw	$2a$12$PrDsMsexNjh2kaPNLEoP1e2VBst4fk9c7CLKg0wQRL46E9gzgItOe	user	t	2026-06-04 10:35:36.780429+02	2026-06-04 10:35:36.780429+02
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customers customers_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);


--
-- Name: customers customers_national_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_national_id_key UNIQUE (national_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: escalations escalations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escalations
    ADD CONSTRAINT escalations_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_extinguisher_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_extinguisher_code_key UNIQUE (extinguisher_code);


--
-- Name: extinguishers extinguishers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_serial_number_key UNIQUE (serial_number);


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: maintenance maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_customers_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_code ON public.customers USING btree (customer_code);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_extinguishers_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extinguishers_code ON public.extinguishers USING btree (extinguisher_code);


--
-- Name: idx_extinguishers_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extinguishers_customer ON public.extinguishers USING btree (customer_id);


--
-- Name: idx_extinguishers_expiry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extinguishers_expiry ON public.extinguishers USING btree (expiry_date);


--
-- Name: idx_extinguishers_serial; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extinguishers_serial ON public.extinguishers USING btree (serial_number);


--
-- Name: idx_extinguishers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extinguishers_status ON public.extinguishers USING btree (status);


--
-- Name: idx_inspections_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_date ON public.inspections USING btree (inspection_date);


--
-- Name: idx_inspections_extinguisher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_extinguisher ON public.inspections USING btree (extinguisher_id);


--
-- Name: idx_maintenance_extinguisher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_extinguisher ON public.maintenance USING btree (extinguisher_id);


--
-- Name: idx_notifications_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_customer ON public.notifications USING btree (customer_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_otps_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_email ON public.otps USING btree (email);


--
-- Name: idx_otps_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_expires ON public.otps USING btree (expires_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: escalations update_escalations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_escalations_updated_at BEFORE UPDATE ON public.escalations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: extinguishers update_extinguishers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_extinguishers_updated_at BEFORE UPDATE ON public.extinguishers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inspections update_inspections_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maintenance update_maintenance_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: escalations escalations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escalations
    ADD CONSTRAINT escalations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: escalations escalations_extinguisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escalations
    ADD CONSTRAINT escalations_extinguisher_id_fkey FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: escalations escalations_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escalations
    ADD CONSTRAINT escalations_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: extinguishers extinguishers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: extinguishers extinguishers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: inspections inspections_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: inspections inspections_extinguisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_extinguisher_id_fkey FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: inspections inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(id);


--
-- Name: maintenance maintenance_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: maintenance maintenance_extinguisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_extinguisher_id_fkey FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_extinguisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_extinguisher_id_fkey FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: otps otps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DW9ygIMfnQU1ZPYigHuusKfMiGQQugSXAavglTKD3ounZfcWUSwA9Ak0vnaavti

