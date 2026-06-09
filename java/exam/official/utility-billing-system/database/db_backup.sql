--
-- PostgreSQL database dump
--

\restrict OlYztjWLTPgaPWPGINhB8j6z0rfTxwrc9SWAWB6FfEr412tO0eVGi2XgaMWv7sm

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bills (
    id uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    balance numeric(14,2) NOT NULL,
    bill_number character varying(255) NOT NULL,
    billing_month date NOT NULL,
    consumption numeric(14,2) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    due_date date NOT NULL,
    paid_amount numeric(14,2) NOT NULL,
    status character varying(255) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    updated_at timestamp(6) without time zone,
    customer_id uuid NOT NULL,
    meter_id uuid NOT NULL,
    reading_id uuid,
    CONSTRAINT bills_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PARTIALLY_PAID'::character varying, 'PAID'::character varying, 'OVERDUE'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.bills OWNER TO postgres;

--
-- Name: customer_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_notifications (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    message character varying(1000) NOT NULL,
    recipient character varying(255) NOT NULL,
    sent_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    customer_id uuid NOT NULL,
    CONSTRAINT customer_notifications_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SENT'::character varying, 'FAILED'::character varying])::text[]))),
    CONSTRAINT customer_notifications_type_check CHECK (((type)::text = ANY ((ARRAY['BILL_GENERATED'::character varying, 'PAYMENT_RECEIVED'::character varying, 'PAYMENT_OVERDUE'::character varying, 'PASSWORD_RESET'::character varying, 'ACCOUNT_VERIFICATION'::character varying])::text[])))
);


ALTER TABLE public.customer_notifications OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    address character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    customer_number character varying(255) NOT NULL,
    district character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    national_id character varying(255) NOT NULL,
    phone_number character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id uuid,
    CONSTRAINT customers_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: meter_readings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meter_readings (
    id uuid NOT NULL,
    billing_month date NOT NULL,
    consumption numeric(14,3) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    current_reading numeric(14,3) NOT NULL,
    previous_reading numeric(14,3) NOT NULL,
    reading_date date NOT NULL,
    meter_id uuid NOT NULL
);


ALTER TABLE public.meter_readings OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    paid_at timestamp(6) without time zone NOT NULL,
    payment_method character varying(255) NOT NULL,
    payment_reference character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    bill_id uuid NOT NULL,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'REVERSED'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: penalty_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalty_configurations (
    id uuid NOT NULL,
    active boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    grace_period_days integer NOT NULL,
    name character varying(255) NOT NULL,
    rate numeric(5,2) NOT NULL,
    updated_at timestamp(6) without time zone,
    utility_type character varying(255) NOT NULL,
    CONSTRAINT penalty_configurations_utility_type_check CHECK (((utility_type)::text = ANY ((ARRAY['WATER'::character varying, 'ELECTRICITY'::character varying])::text[])))
);


ALTER TABLE public.penalty_configurations OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    expiry_date timestamp(6) with time zone NOT NULL,
    token character varying(255) NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: tariff_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tariff_tiers (
    id uuid NOT NULL,
    tier_max numeric(14,3) NOT NULL,
    tier_min numeric(14,3) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    tariff_id uuid NOT NULL
);


ALTER TABLE public.tariff_tiers OWNER TO postgres;

--
-- Name: tariffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tariffs (
    id uuid NOT NULL,
    active boolean NOT NULL,
    billing_mode character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    effective_end_cycle character varying(7),
    effective_start_cycle character varying(7) NOT NULL,
    fixed_service_charge numeric(14,2) NOT NULL,
    tariff_code character varying(255) NOT NULL,
    tariff_type character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    utility_type character varying(255) NOT NULL,
    vat_rate numeric(5,2) NOT NULL,
    version integer NOT NULL,
    CONSTRAINT tariffs_billing_mode_check CHECK (((billing_mode)::text = ANY ((ARRAY['PREPAID'::character varying, 'POSTPAID'::character varying])::text[]))),
    CONSTRAINT tariffs_tariff_type_check CHECK (((tariff_type)::text = ANY ((ARRAY['FLAT'::character varying, 'TIER_BASED'::character varying])::text[]))),
    CONSTRAINT tariffs_utility_type_check CHECK (((utility_type)::text = ANY ((ARRAY['WATER'::character varying, 'ELECTRICITY'::character varying])::text[])))
);


ALTER TABLE public.tariffs OWNER TO postgres;

--
-- Name: tax_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_configurations (
    id uuid NOT NULL,
    active boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    effective_from character varying(7) NOT NULL,
    name character varying(255) NOT NULL,
    rate numeric(5,2) NOT NULL,
    updated_at timestamp(6) without time zone,
    utility_type character varying(255) NOT NULL,
    CONSTRAINT tax_configurations_utility_type_check CHECK (((utility_type)::text = ANY ((ARRAY['WATER'::character varying, 'ELECTRICITY'::character varying])::text[])))
);


ALTER TABLE public.tax_configurations OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    access_tokens_invalidated_at timestamp(6) without time zone,
    account_non_locked boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    national_id character varying(255),
    password character varying(255) NOT NULL,
    password_reset_token character varying(255),
    password_reset_token_expiry timestamp(6) without time zone,
    phone_number character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    token_version integer DEFAULT 0 NOT NULL,
    updated_at timestamp(6) without time zone,
    verification_token character varying(255),
    verification_token_expiry timestamp(6) without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ROLE_ADMIN'::character varying, 'ROLE_OPERATOR'::character varying, 'ROLE_FINANCE'::character varying, 'ROLE_CUSTOMER'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: utility_meters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_meters (
    id uuid NOT NULL,
    billing_mode character varying(255) NOT NULL,
    company character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    installation_address character varying(255) NOT NULL,
    installation_date date NOT NULL,
    meter_number character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    utility_type character varying(255) NOT NULL,
    customer_id uuid NOT NULL,
    CONSTRAINT utility_meters_billing_mode_check CHECK (((billing_mode)::text = ANY ((ARRAY['PREPAID'::character varying, 'POSTPAID'::character varying])::text[]))),
    CONSTRAINT utility_meters_company_check CHECK (((company)::text = ANY ((ARRAY['WASAC'::character varying, 'REG'::character varying])::text[]))),
    CONSTRAINT utility_meters_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[]))),
    CONSTRAINT utility_meters_utility_type_check CHECK (((utility_type)::text = ANY ((ARRAY['WATER'::character varying, 'ELECTRICITY'::character varying])::text[])))
);


ALTER TABLE public.utility_meters OWNER TO postgres;

--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bills (id, amount, balance, bill_number, billing_month, consumption, created_at, due_date, paid_amount, status, unit_price, updated_at, customer_id, meter_id, reading_id) FROM stdin;
33b15b06-b37c-4a68-b1f0-1f0d7a7db060	13168.80	3000.00	BILL-202606-001191	2026-06-01	67.00	2026-06-07 12:09:49.905019	2026-07-07	10168.80	PARTIALLY_PAID	0.00	2026-06-07 12:15:21.868088	464926d4-4987-4e72-acce-2393b5b5682e	0d6b54b2-b3d8-4dfc-b105-0a8e1a6179c1	12758532-499c-4a3c-a0cc-209e5caadd0d
\.


--
-- Data for Name: customer_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_notifications (id, created_at, message, recipient, sent_at, status, subject, type, customer_id) FROM stdin;
9c3bfbcb-267b-4570-a28a-2e0959a7a83c	2026-06-07 12:09:49.907034	Dear Ngabo Test, Your 2026-06 utility bill of 13168.80 FRW has been successfully processed.	ingabo1234@gmail.com	\N	SENT	Utility Bill Generated – 2026-06	BILL_GENERATED	464926d4-4987-4e72-acce-2393b5b5682e
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, address, created_at, customer_number, district, email, full_name, national_id, phone_number, status, updated_at, user_id) FROM stdin;
464926d4-4987-4e72-acce-2393b5b5682e	Kigali	2026-06-07 11:48:19.388732	CUST-080006	Gasabo	ingabo1234@gmail.com	Ngabo Test	1199880200000110	+250788888888	ACTIVE	2026-06-07 11:48:19.388732	f7b3afd3-5f6b-4e89-b40b-b44b49320fc1
\.


--
-- Data for Name: meter_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meter_readings (id, billing_month, consumption, created_at, current_reading, previous_reading, reading_date, meter_id) FROM stdin;
12758532-499c-4a3c-a0cc-209e5caadd0d	2026-06-01	67.000	2026-06-07 11:52:39.007002	67.000	0.000	2026-06-07	0d6b54b2-b3d8-4dfc-b105-0a8e1a6179c1
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, amount, paid_at, payment_method, payment_reference, status, bill_id) FROM stdin;
9aeffa4c-3f1c-4759-9ac1-130ea486939f	10168.80	2026-06-07 12:15:21.865088	MOMO	MOMO-0001	COMPLETED	33b15b06-b37c-4a68-b1f0-1f0d7a7db060
\.


--
-- Data for Name: penalty_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalty_configurations (id, active, created_at, grace_period_days, name, rate, updated_at, utility_type) FROM stdin;
613cbce9-8b3c-4599-a78d-9eee0df505da	t	2026-06-07 12:09:13.032029	15	Late Payment Penalty	5.00	2026-06-07 12:09:13.032029	WATER
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, expiry_date, token, user_id) FROM stdin;
88cc2bc1-6f38-429c-8b9a-f505901c7228	2026-06-14 11:45:20.591611+02	62f2b8e6-9e9e-4f0c-a7a5-c4cfe48cc537	f7b3afd3-5f6b-4e89-b40b-b44b49320fc1
55db9511-647f-4995-965e-7e86fc4e1c6a	2026-06-14 12:07:52.601355+02	ebff6080-40f9-483e-b310-2213bba7f59d	39bc7de3-f263-4ea2-955b-3562425c3b4e
\.


--
-- Data for Name: tariff_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tariff_tiers (id, tier_max, tier_min, unit_price, tariff_id) FROM stdin;
dfd0aef9-7662-47e4-87e4-bb6bf469195e	15.000	0.000	120.00	555a6ed4-ebe6-4db2-86a6-6accf4a47b4b
6785860c-73bb-4535-a7c0-3e40463b9951	50.000	15.000	180.00	555a6ed4-ebe6-4db2-86a6-6accf4a47b4b
\.


--
-- Data for Name: tariffs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tariffs (id, active, billing_mode, created_at, effective_end_cycle, effective_start_cycle, fixed_service_charge, tariff_code, tariff_type, updated_at, utility_type, vat_rate, version) FROM stdin;
555a6ed4-ebe6-4db2-86a6-6accf4a47b4b	t	PREPAID	2026-06-07 12:06:09.120035	2026-12	2026-06	0.00	WATER_PREPAID_TIER_202606_V1	TIER_BASED	2026-06-07 12:06:09.13097	WATER	18.00	1
\.


--
-- Data for Name: tax_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_configurations (id, active, created_at, effective_from, name, rate, updated_at, utility_type) FROM stdin;
73924d7c-367f-4e4b-98af-46db181cfd07	t	2026-06-07 12:08:56.192411	2026-06	VAT Water	18.00	2026-06-07 12:08:56.192411	WATER
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, access_tokens_invalidated_at, account_non_locked, created_at, email, full_name, national_id, password, password_reset_token, password_reset_token_expiry, phone_number, role, status, token_version, updated_at, verification_token, verification_token_expiry) FROM stdin;
39bc7de3-f263-4ea2-955b-3562425c3b4e	\N	t	2026-06-07 11:34:05.605917	admin@example.com	Super Admin	\N	$2a$10$qfXjkGDpELWI4YgiD1eP2OlTdD6RgRiOTXCUNylpte05R0GvtHeje	\N	\N	+250780000000	ROLE_ADMIN	ACTIVE	0	2026-06-07 11:34:05.605917	\N	\N
7b50ef33-2b40-43b1-aefb-73d31b3342c7	\N	t	2026-06-07 11:36:43.565553	landryasimwe@gmail.com	Asimwe Landry	1199880200000100	$2a$10$KpVQUIwvCueSWDC38zaIFuAbE2zOSfPRtzZOlpBxJm03Xn7qyrYue	\N	\N	+250788888888	ROLE_CUSTOMER	ACTIVE	0	2026-06-07 11:39:25.863325	\N	\N
f7b3afd3-5f6b-4e89-b40b-b44b49320fc1	\N	t	2026-06-07 11:43:43.942873	ingabo1234@gmail.com	Ngabo Test	1199880200000110	$2a$10$Mlj/pgtW4o2BjN5uMGt0weKVEL2MwKJmz/urWm9CRRaD5hFxPQHaG	\N	\N	+250788888888	ROLE_CUSTOMER	ACTIVE	0	2026-06-07 11:44:45.28872	\N	\N
\.


--
-- Data for Name: utility_meters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_meters (id, billing_mode, company, created_at, installation_address, installation_date, meter_number, status, updated_at, utility_type, customer_id) FROM stdin;
0d6b54b2-b3d8-4dfc-b105-0a8e1a6179c1	PREPAID	WASAC	2026-06-07 11:50:43.517446	Gasabo	2026-06-07	WASAC-0001	ACTIVE	2026-06-07 11:50:43.517446	WATER	464926d4-4987-4e72-acce-2393b5b5682e
\.


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: customer_notifications customer_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_notifications
    ADD CONSTRAINT customer_notifications_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: meter_readings meter_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meter_readings
    ADD CONSTRAINT meter_readings_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: penalty_configurations penalty_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_configurations
    ADD CONSTRAINT penalty_configurations_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: tariff_tiers tariff_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tariff_tiers
    ADD CONSTRAINT tariff_tiers_pkey PRIMARY KEY (id);


--
-- Name: tariffs tariffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tariffs
    ADD CONSTRAINT tariffs_pkey PRIMARY KEY (id);


--
-- Name: tax_configurations tax_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_configurations
    ADD CONSTRAINT tax_configurations_pkey PRIMARY KEY (id);


--
-- Name: meter_readings uk87065g2in9jier9axn6or3yhf; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meter_readings
    ADD CONSTRAINT uk87065g2in9jier9axn6or3yhf UNIQUE (meter_id, billing_month);


--
-- Name: payments uk_4jacl30fsqtdp5mhmg5wnvn7q; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uk_4jacl30fsqtdp5mhmg5wnvn7q UNIQUE (payment_reference);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: bills uk_7959pofuil5cipraog67b4j29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT uk_7959pofuil5cipraog67b4j29 UNIQUE (bill_number);


--
-- Name: refresh_tokens uk_7tdcd6ab5wsgoudnvj7xf1b7l; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_7tdcd6ab5wsgoudnvj7xf1b7l UNIQUE (user_id);


--
-- Name: customers uk_e9mc7sqi5m0vi278e2h2tmioe; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uk_e9mc7sqi5m0vi278e2h2tmioe UNIQUE (national_id);


--
-- Name: customers uk_euat1oase6eqv195jvb71a93s; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uk_euat1oase6eqv195jvb71a93s UNIQUE (user_id);


--
-- Name: refresh_tokens uk_ghpmfn23vmxfu3spu3lfg4r2d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_ghpmfn23vmxfu3spu3lfg4r2d UNIQUE (token);


--
-- Name: tariffs uk_i0av00dvvd29amtvu3pgg87sb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tariffs
    ADD CONSTRAINT uk_i0av00dvvd29amtvu3pgg87sb UNIQUE (tariff_code);


--
-- Name: utility_meters uk_kljnqxllub2uteepjy02kry3r; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meters
    ADD CONSTRAINT uk_kljnqxllub2uteepjy02kry3r UNIQUE (meter_number);


--
-- Name: users uk_s0nmswa3ot4wkeja9vk4tlml6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_s0nmswa3ot4wkeja9vk4tlml6 UNIQUE (national_id);


--
-- Name: customers uk_t74y58jagthxqxysuw9l0jx6y; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uk_t74y58jagthxqxysuw9l0jx6y UNIQUE (customer_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: utility_meters utility_meters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meters
    ADD CONSTRAINT utility_meters_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens fk1lih5y2npsf8u5o3vhdb9y0os; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk1lih5y2npsf8u5o3vhdb9y0os FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bills fk1rtnpgvhs9hqthvu89tl36fe7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk1rtnpgvhs9hqthvu89tl36fe7 FOREIGN KEY (reading_id) REFERENCES public.meter_readings(id);


--
-- Name: customer_notifications fk3195hk1a47mqgstpj8jg696ot; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_notifications
    ADD CONSTRAINT fk3195hk1a47mqgstpj8jg696ot FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: tariff_tiers fk90xk77nst2f05cmrod4d5q42h; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tariff_tiers
    ADD CONSTRAINT fk90xk77nst2f05cmrod4d5q42h FOREIGN KEY (tariff_id) REFERENCES public.tariffs(id);


--
-- Name: payments fk9565r6579khpdjxnyla0l2ycd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk9565r6579khpdjxnyla0l2ycd FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bills fkfw8at3gqn5juors304vxw090n; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fkfw8at3gqn5juors304vxw090n FOREIGN KEY (meter_id) REFERENCES public.utility_meters(id);


--
-- Name: utility_meters fkhgwj250hc3nh6cysq7aunis5c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meters
    ADD CONSTRAINT fkhgwj250hc3nh6cysq7aunis5c FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: meter_readings fki7dtd0ndh55q6oqlmkegf23lv; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meter_readings
    ADD CONSTRAINT fki7dtd0ndh55q6oqlmkegf23lv FOREIGN KEY (meter_id) REFERENCES public.utility_meters(id);


--
-- Name: bills fkoy9sc2dmxj2qwjeiiilf3yuxp; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fkoy9sc2dmxj2qwjeiiilf3yuxp FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customers fkrh1g1a20omjmn6kurd35o3eit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fkrh1g1a20omjmn6kurd35o3eit FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict OlYztjWLTPgaPWPGINhB8j6z0rfTxwrc9SWAWB6FfEr412tO0eVGi2XgaMWv7sm

