--
-- PostgreSQL database cluster dump
--

\restrict W72hnjTeyCABXinQihJSCUy5TAvaYY2jBZxmttfjn5QcPYv5HqChai3Tbk1xhTX

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--

DROP DATABASE mortgage_db;




--
-- Drop roles
--

DROP ROLE admin_core;


--
-- Roles
--

CREATE ROLE admin_core;
ALTER ROLE admin_core WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:1vZc1BSx/1jJsNqZBva7Fg==$74ijedi7PWoDvXbtKUITbQoQ0e6iKXvrsVYqWBSx1IY=:6+4khNmylFzs2Am+gIb3uIDYJEN5kMBQnYDwnDDNomk=';

--
-- User Configurations
--








\unrestrict W72hnjTeyCABXinQihJSCUy5TAvaYY2jBZxmttfjn5QcPYv5HqChai3Tbk1xhTX

--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

\restrict zOhLj8r1asNrx2zlLRhF7OqUepv6Sen8WnQQLF8FLn8ieBo54jZcQ8kWDO5jD5V

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: admin_core
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO admin_core;

\unrestrict zOhLj8r1asNrx2zlLRhF7OqUepv6Sen8WnQQLF8FLn8ieBo54jZcQ8kWDO5jD5V
\connect template1
\restrict zOhLj8r1asNrx2zlLRhF7OqUepv6Sen8WnQQLF8FLn8ieBo54jZcQ8kWDO5jD5V

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
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: admin_core
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: admin_core
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\unrestrict zOhLj8r1asNrx2zlLRhF7OqUepv6Sen8WnQQLF8FLn8ieBo54jZcQ8kWDO5jD5V
\connect template1
\restrict zOhLj8r1asNrx2zlLRhF7OqUepv6Sen8WnQQLF8FLn8ieBo54jZcQ8kWDO5jD5V

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
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: admin_core
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict zOhLj8r1asNrx2zlLRhF7OqUepv6Sen8WnQQLF8FLn8ieBo54jZcQ8kWDO5jD5V

--
-- Database "mortgage_db" dump
--

--
-- PostgreSQL database dump
--

\restrict aBV7FERbI9K2VTn38dB0yfUMhNPRQyscB5WDFZsqHoOqRLyskcW4yuXejbcWtzM

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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
-- Name: mortgage_db; Type: DATABASE; Schema: -; Owner: admin_core
--

CREATE DATABASE mortgage_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE mortgage_db OWNER TO admin_core;

\unrestrict aBV7FERbI9K2VTn38dB0yfUMhNPRQyscB5WDFZsqHoOqRLyskcW4yuXejbcWtzM
\connect mortgage_db
\restrict aBV7FERbI9K2VTn38dB0yfUMhNPRQyscB5WDFZsqHoOqRLyskcW4yuXejbcWtzM

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO admin_core;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO admin_core;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO admin_core;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO admin_core;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO admin_core;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO admin_core;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO admin_core;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO admin_core;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO admin_core;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO admin_core;

--
-- Name: mortgage_app_bank; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.mortgage_app_bank (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    logo_url character varying(200),
    is_active boolean NOT NULL
);


ALTER TABLE public.mortgage_app_bank OWNER TO admin_core;

--
-- Name: mortgage_app_bank_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.mortgage_app_bank ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.mortgage_app_bank_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mortgage_app_bankproduct; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.mortgage_app_bankproduct (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    product_key character varying(50) NOT NULL,
    bank_id bigint NOT NULL,
    politicas_json jsonb NOT NULL
);


ALTER TABLE public.mortgage_app_bankproduct OWNER TO admin_core;

--
-- Name: mortgage_app_bankproduct_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.mortgage_app_bankproduct ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.mortgage_app_bankproduct_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mortgage_app_loanapplication; Type: TABLE; Schema: public; Owner: admin_core
--

CREATE TABLE public.mortgage_app_loanapplication (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    "annual_inc_MXN2025" numeric(12,2) NOT NULL,
    "loan_amnt_MXN2025" numeric(12,2) NOT NULL,
    "installment_MXN2025" numeric(10,2) NOT NULL,
    dti double precision NOT NULL,
    delinq_2yrs integer NOT NULL,
    inq_last_6mths integer NOT NULL,
    open_acc integer NOT NULL,
    pub_rec integer NOT NULL,
    "revol_bal_MXN2025" numeric(15,2) NOT NULL,
    revol_util double precision NOT NULL,
    total_acc integer NOT NULL,
    earliest_cr_line integer NOT NULL,
    "tot_cur_bal_MXN2025" numeric(15,2) NOT NULL,
    "tot_coll_amt_MXN2025" numeric(15,2) NOT NULL,
    "total_rev_hi_lim_MXN2025" numeric(15,2) NOT NULL,
    home_ownership character varying(20) NOT NULL,
    verification_status character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    risk_label character varying(50),
    created_at timestamp with time zone NOT NULL,
    collection_recovery_fee numeric(12,2) NOT NULL,
    collections_12_mths_ex_med integer NOT NULL,
    full_name character varying(255) NOT NULL,
    has_critical_warning boolean NOT NULL,
    recoveries integer NOT NULL,
    risk_score double precision,
    selected_product_id bigint,
    warning_message text,
    probabilities jsonb,
    applied_with_adjustment boolean NOT NULL,
    requested_down_payment numeric(12,2) NOT NULL,
    is_rescue_mode_active boolean NOT NULL,
    property_value numeric(12,2) NOT NULL,
    requested_term_months integer NOT NULL,
    calculated_cat double precision,
    engine_dti_ratio double precision,
    engine_ltv_ratio double precision,
    suggested_down_payment numeric(12,2),
    suggested_installment numeric(10,2),
    suggested_loan_amount numeric(12,2),
    user_accepted_suggestion boolean NOT NULL,
    user_profile_data jsonb NOT NULL
);


ALTER TABLE public.mortgage_app_loanapplication OWNER TO admin_core;

--
-- Name: mortgage_app_loanapplication_id_seq; Type: SEQUENCE; Schema: public; Owner: admin_core
--

ALTER TABLE public.mortgage_app_loanapplication ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.mortgage_app_loanapplication_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add loan application	7	add_loanapplication
26	Can change loan application	7	change_loanapplication
27	Can delete loan application	7	delete_loanapplication
28	Can view loan application	7	view_loanapplication
29	Can add bank	8	add_bank
30	Can change bank	8	change_bank
31	Can delete bank	8	delete_bank
32	Can view bank	8	view_bank
33	Can add product rate	9	add_productrate
34	Can change product rate	9	change_productrate
35	Can delete product rate	9	delete_productrate
36	Can view product rate	9	view_productrate
37	Can add bank product	10	add_bankproduct
38	Can change bank product	10	change_bankproduct
39	Can delete bank product	10	delete_bankproduct
40	Can view bank product	10	view_bankproduct
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
1	pbkdf2_sha256$600000$KXcnIusPo8SZ1NJyv7kYeK$OcpiUoilIaFEA8IRn/9E+3fgHiVMod8Y8tHuT7hm1zU=	2026-03-26 18:01:11.585785+00	t	admin			angelnava1904@gmail.com	t	t	2026-03-26 18:00:49.416875+00
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
1	2026-03-26 18:02:02.040862+00	49	Solicitud 49 - Audit Full	3		7	1
2	2026-03-26 18:02:02.044151+00	48	Solicitud 48 - Audit Full	3		7	1
3	2026-03-26 18:02:02.04602+00	47	Solicitud 47 - Audit Full	3		7	1
4	2026-03-26 18:02:02.047991+00	46	Solicitud 46 - Audit Full	3		7	1
5	2026-03-26 18:02:02.049513+00	45	Solicitud 45 - Audit Full	3		7	1
6	2026-03-26 18:02:02.051235+00	44	Solicitud 44 - Audit Full	3		7	1
7	2026-03-26 18:02:02.052958+00	43	Solicitud 43 - Audit Full	3		7	1
8	2026-03-26 18:02:02.054636+00	42	Solicitud 42 - Audit Full	3		7	1
9	2026-03-26 18:02:02.056209+00	41	Solicitud 41 - Audit Full	3		7	1
10	2026-03-26 18:02:02.057622+00	40	Solicitud 40 - Audit Full	3		7	1
11	2026-03-26 18:02:02.059151+00	39	Solicitud 39 - Audit Full	3		7	1
12	2026-03-26 18:02:02.060652+00	38	Solicitud 38 - Audit Full	3		7	1
13	2026-03-26 18:02:02.061822+00	37	Solicitud 37 - Audit Full	3		7	1
14	2026-03-26 18:02:02.063132+00	36	Solicitud 36 - Audit Full	3		7	1
15	2026-03-26 18:02:02.064306+00	35	Solicitud 35 - Audit Full	3		7	1
16	2026-03-26 18:02:02.065507+00	34	Solicitud 34 - Audit Full	3		7	1
17	2026-03-26 18:02:02.066829+00	33	Solicitud 33 - Audit Full	3		7	1
18	2026-03-26 18:02:02.068177+00	32	Solicitud 32 - Audit Full	3		7	1
19	2026-03-26 18:02:02.0693+00	31	Solicitud 31 - Audit DS	3		7	1
20	2026-03-26 18:02:02.070367+00	30	Solicitud 30 - Audit DS	3		7	1
21	2026-03-26 18:02:02.071485+00	29	Solicitud 29 - Audit DS	3		7	1
22	2026-03-26 18:02:02.072794+00	28	Solicitud 28 - Auditoria DS	3		7	1
23	2026-03-26 18:02:02.07406+00	27	Solicitud 27 - Auditoria DS	3		7	1
24	2026-03-26 18:02:02.075248+00	26	Solicitud 26 - Auditoria DS	3		7	1
25	2026-03-26 18:02:02.076337+00	25	Solicitud 25 - Auditoria DS	3		7	1
26	2026-03-26 18:02:02.077566+00	24	Solicitud 24 - Auditoria DS	3		7	1
27	2026-03-26 18:02:02.078788+00	23	Solicitud 23 - Auditoria DS	3		7	1
28	2026-03-26 18:02:02.080085+00	22	Solicitud 22 - Auditoria DS	3		7	1
29	2026-03-26 18:02:02.081229+00	21	Solicitud 21 - Auditoria DS	3		7	1
30	2026-03-26 18:02:02.082345+00	20	Solicitud 20 - Financiero OK / Quita Real	3		7	1
31	2026-03-26 18:02:02.083487+00	19	Solicitud 19 - Historial Negativo	3		7	1
32	2026-03-26 18:02:02.084745+00	18	Solicitud 18 - Sobre-endeudado	3		7	1
33	2026-03-26 18:02:02.086077+00	17	Solicitud 17 - Cliente Diamante	3		7	1
34	2026-03-26 18:02:02.08726+00	16	Solicitud 16 - Financiero OK / Quita Real	3		7	1
35	2026-03-26 18:02:02.088476+00	15	Solicitud 15 - Historial Negativo	3		7	1
36	2026-03-26 18:02:02.08968+00	14	Solicitud 14 - Sobre-endeudado	3		7	1
37	2026-03-26 18:02:02.09078+00	13	Solicitud 13 - Cliente Diamante	3		7	1
38	2026-03-26 18:02:02.091934+00	12	Solicitud 12 - Financiero OK / Quita Real	3		7	1
39	2026-03-26 18:02:02.093275+00	11	Solicitud 11 - Historial Negativo	3		7	1
40	2026-03-26 18:02:02.094458+00	10	Solicitud 10 - Sobre-endeudado	3		7	1
41	2026-03-26 18:02:02.095572+00	9	Solicitud 9 - Cliente Diamante	3		7	1
42	2026-03-26 18:02:02.096651+00	8	Solicitud 8 - Financiero OK / Quita Real	3		7	1
43	2026-03-26 18:02:02.097672+00	7	Solicitud 7 - Historial Negativo	3		7	1
44	2026-03-26 18:02:02.098892+00	6	Solicitud 6 - Sobre-endeudado	3		7	1
45	2026-03-26 18:02:02.100094+00	5	Solicitud 5 - Cliente Diamante	3		7	1
46	2026-03-26 18:02:02.101207+00	4	Solicitud 4 - Cliente con Antecedentes	3		7	1
47	2026-03-26 18:02:02.102242+00	3	Solicitud 3 - Gustavo Navarro	3		7	1
48	2026-03-26 18:02:02.103416+00	2	Solicitud 2 - Cliente con Antecedentes	3		7	1
49	2026-03-26 18:02:02.104635+00	1	Solicitud 1 - Gustavo Navarro	3		7	1
50	2026-03-26 18:13:54.872861+00	55	Solicitud 55 - Audit Full	3		7	1
51	2026-03-26 18:13:54.876791+00	54	Solicitud 54 - Audit Full	3		7	1
52	2026-03-26 18:13:54.878872+00	53	Solicitud 53 - Audit Full	3		7	1
53	2026-03-26 18:13:54.880154+00	52	Solicitud 52 - Audit Full	3		7	1
54	2026-03-26 18:13:54.88131+00	51	Solicitud 51 - Audit Full	3		7	1
55	2026-03-26 18:13:54.882691+00	50	Solicitud 50 - Audit Full	3		7	1
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	sessions	session
7	mortgage_app	loanapplication
8	mortgage_app	bank
9	mortgage_app	productrate
10	mortgage_app	bankproduct
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2026-03-25 09:16:34.424894+00
2	auth	0001_initial	2026-03-25 09:16:34.496515+00
3	admin	0001_initial	2026-03-25 09:16:34.515279+00
4	admin	0002_logentry_remove_auto_add	2026-03-25 09:16:34.520528+00
5	admin	0003_logentry_add_action_flag_choices	2026-03-25 09:16:34.525653+00
6	contenttypes	0002_remove_content_type_name	2026-03-25 09:16:34.535533+00
7	auth	0002_alter_permission_name_max_length	2026-03-25 09:16:34.541006+00
8	auth	0003_alter_user_email_max_length	2026-03-25 09:16:34.546911+00
9	auth	0004_alter_user_username_opts	2026-03-25 09:16:34.552364+00
10	auth	0005_alter_user_last_login_null	2026-03-25 09:16:34.557335+00
11	auth	0006_require_contenttypes_0002	2026-03-25 09:16:34.559657+00
12	auth	0007_alter_validators_add_error_messages	2026-03-25 09:16:34.565111+00
13	auth	0008_alter_user_username_max_length	2026-03-25 09:16:34.574619+00
14	auth	0009_alter_user_last_name_max_length	2026-03-25 09:16:34.580912+00
15	auth	0010_alter_group_name_max_length	2026-03-25 09:16:34.587922+00
16	auth	0011_update_proxy_permissions	2026-03-25 09:16:34.592947+00
17	auth	0012_alter_user_first_name_max_length	2026-03-25 09:16:34.59816+00
18	mortgage_app	0001_initial	2026-03-25 09:21:18.808296+00
19	sessions	0001_initial	2026-03-25 09:21:18.82584+00
20	mortgage_app	0002_rename_loan_amount_loanapplication_annual_inc_mxn2025_and_more	2026-03-25 22:22:23.143393+00
21	mortgage_app	0003_rename_loan_amnt_mxn2025_loanapplication_temp_loan_and_more	2026-03-25 22:28:02.672397+00
22	mortgage_app	0004_rename_tenmp_income_loanapplication_annual_inc_mxn2025_and_more	2026-03-25 22:28:02.68099+00
23	mortgage_app	0005_rename_earliest_cr_line_year_loanapplication_earliest_cr_line_and_more	2026-03-25 23:11:01.209861+00
24	mortgage_app	0006_loanapplication_probabilities	2026-03-26 18:13:41.169167+00
25	mortgage_app	0007_loanapplication_applied_with_adjustment_and_more	2026-03-30 00:35:16.716828+00
26	mortgage_app	0008_bankproduct_appraisal_iva_pct_and_more	2026-03-30 02:27:59.666754+00
27	mortgage_app	0009_rename_down_payment_loanapplication_requested_down_payment_and_more	2026-03-30 05:07:08.168181+00
28	mortgage_app	0010_remove_bankproduct_appraisal_iva_pct_and_more	2026-03-30 06:47:35.39675+00
29	mortgage_app	0011_remove_bankproduct_admin_fee_monthly_and_more	2026-03-30 09:34:19.021791+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
2j05xi6ucpk5ajy0u3rhzz3xm8op1w0m	.eJxVjDsOwjAQBe_iGln2Ev8o6TmDteu1cQA5UpxUiLuTSCmgfTPz3iLiutS49jzHkcVFaHH63QjTM7cd8APbfZJpass8ktwVedAubxPn1_Vw_w4q9rrV5wJBW_AemBOZoAhs0k7poEMJw0YAUBOYhGSttwwOvQ2Dc2yUKll8vrZyNr0:1w5p15:iFR7FGBkgHFMz00NoEIpQCXr8TQGmM0iKI7di54ya5I	2026-04-09 18:01:11.591529+00
\.


--
-- Data for Name: mortgage_app_bank; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.mortgage_app_bank (id, name, slug, logo_url, is_active) FROM stdin;
1	Banorte	banorte	\N	t
2	Santander	santander	\N	t
3	Scotiabank	scotia	\N	t
\.


--
-- Data for Name: mortgage_app_bankproduct; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.mortgage_app_bankproduct (id, name, product_key, bank_id, politicas_json) FROM stdin;
1	Hipoteca Fuerte Tradicional	banorte_tradicional	1	{"tasas": [{"nombre": "Premium", "tasa_anual_fija": 0.0938}, {"nombre": "Mínima", "tasa_anual_fija": 0.0988}, {"nombre": "Baja", "tasa_anual_fija": 0.1018}, {"nombre": "Media", "tasa_anual_fija": 0.1068}, {"nombre": "Alta", "tasa_anual_fija": 0.1118}], "nombre": "Hipoteca Fuerte Tradicional", "politicas": {"cat": {"incluye_apertura_financiada_t0": true}, "tipo": "tradicional", "apoyos": {"tiene_apoyos": false, "instituto_tiene_credito": false, "aforo_total_max_instituto": null}, "interes": {"base": 360, "metodo": "dias", "dias_promedio_mes": 30.4, "dias_primer_periodo": 8}, "seguros": {"vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.65}, "danos": {"iva": 0.16, "metodo": "porcentaje_saldo", "tasa_anual": 0.0075}, "suma_asegurable_pct": 0.70}, "aforo_max": 0.90, "notariales": {"pct": 0.082, "modo": "porcentaje"}, "relacion_ir": 2.0, "avaluo_iva_pct": 0.16, "avaluo_pct_mil": 0.0025, "gastos_aprobacion": 750.00, "comision_apertura_pct": 0.01, "comision_admin_mensual": 299.00, "comision_apertura_financiada": true}}
2	Banorte Apoyo INFONAVIT	banorte_apoyo	1	{"tasas": [{"nombre": "Premium", "tasa_anual_fija": 0.0938}, {"nombre": "Mínima", "tasa_anual_fija": 0.0988}, {"nombre": "Baja", "tasa_anual_fija": 0.1018}, {"nombre": "Media", "tasa_anual_fija": 0.1068}, {"nombre": "Alta", "tasa_anual_fija": 0.1118}], "nombre": "Banorte Apoyo INFONAVIT", "politicas": {"cat": {"incluye_apertura_financiada_t0": false}, "tipo": "apoyo", "apoyos": {"tiene_apoyos": true, "instituto_tiene_credito": false, "aforo_total_max_instituto": null}, "seguros": {"vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.934, "monto_mensual_fijo_fallback": 909.00}, "danos": {"metodo": "fijo", "monto_mensual_iva": 392.00}, "suma_asegurable_pct": 0.70}, "aforo_max": 0.90, "notariales": {"modo": "monto", "monto": 164000.00}, "relacion_ir": 2.0, "avaluo_iva_pct": 0.16, "avaluo_pct_mil": 0.0025, "gastos_aprobacion": 750.00, "comision_apertura_pct": 0.01, "comision_admin_mensual": 299.00, "comision_apertura_financiada": true}}
3	Banorte Cofinavit	banorte_cofinavit	1	{"tasas": [{"nombre": "Premium", "tasa_anual_fija": 0.0938}, {"nombre": "Mínima", "tasa_anual_fija": 0.0988}, {"nombre": "Baja", "tasa_anual_fija": 0.1018}, {"nombre": "Media", "tasa_anual_fija": 0.1068}, {"nombre": "Alta", "tasa_anual_fija": 0.1118}], "nombre": "Banorte Cofinavit", "politicas": {"cat": {"incluye_apertura_financiada_t0": false}, "tipo": "cofinavit", "apoyos": {"tiene_apoyos": true, "instituto_tiene_credito": true, "aforo_total_max_instituto": 0.95}, "seguros": {"vida": {"metodo": "fijo", "monto_mensual": 865.35}, "danos": {"metodo": "fijo", "monto_mensual_iva": 392.00}, "suma_asegurable_pct": 0.70}, "aforo_max": 0.95, "notariales": {"pct": 0.082, "modo": "porcentaje"}, "relacion_ir": 2.0, "avaluo_monto": 5800.00, "gastos_aprobacion": 750.00, "gastos_infonavit_pct": 0.03, "comision_apertura_pct": 0.01, "comision_admin_mensual": 299.00, "comision_apertura_financiada": true}}
4	Cuenta INFONAVIT + Banorte	banorte_cta_infonavit	1	{"tasas": [{"nombre": "Premium", "tasa_anual_fija": 0.0938}, {"nombre": "Mínima", "tasa_anual_fija": 0.0988}, {"nombre": "Baja", "tasa_anual_fija": 0.1018}, {"nombre": "Media", "tasa_anual_fija": 0.1068}, {"nombre": "Alta", "tasa_anual_fija": 0.1118}], "nombre": "Cuenta INFONAVIT + Banorte", "politicas": {"cat": {"incluye_apertura_financiada_t0": false}, "tipo": "cta_infonavit", "apoyos": {"tiene_apoyos": true, "instituto_tiene_credito": true, "aforo_total_max_instituto": 0.95}, "seguros": {"vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.606}, "danos": {"metodo": "fijo", "monto_mensual_iva": 392.00}, "suma_asegurable_pct": 0.70}, "aforo_max": 0.95, "notariales": {"pct": 0.082, "modo": "porcentaje"}, "relacion_ir": 2.0, "avaluo_iva_pct": 0.16, "avaluo_pct_mil": 0.0025, "gastos_aprobacion": 750.00, "comision_apertura_pct": 0.01, "comision_admin_mensual": 299.00, "comision_apertura_financiada": true}}
5	Ingresos Adicionales FPT	banorte_fpt	1	{"tasas": [{"nombre": "Ingresos Adicionales FPT", "tasa_anual_fija": 0.0978}], "nombre": "Ingresos Adicionales FPT (FOVISSSTE + Banorte)", "politicas": {"cat": {"incluye_apertura_financiada_t0": false}, "tipo": "fpt", "apoyos": {"tiene_apoyos": true, "instituto_tiene_credito": true, "aforo_total_max_instituto": 0.95}, "seguros": {"vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.377643}, "danos": {"metodo": "fijo", "monto_mensual_iva": 392.00}, "suma_asegurable_pct": 0.70}, "aforo_max": 0.95, "notariales": {"pct": 0.082, "modo": "porcentaje"}, "relacion_ir": 2.0, "gastos_aprobacion": 0.00, "gastos_fovissste_pct": 0.03, "comision_apertura_pct": 0.00, "comision_admin_mensual": 0.00, "comision_apertura_financiada": true}}
6	Hipoteca Santander Tradicional	santander_tradicional	2	{"tipo": "adquisicion", "nombre": "Hipoteca Santander Tradicional", "politicas": {"seguros": {"modo": "cobrados", "vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.5154}, "danos": {"metodo": "pormil", "tarifa_pormil_mensual": 0.3000}, "suma_asegurable_pct": 0.70}, "notariales": {"pct": 0.07, "modo": "porcentaje"}, "avaluo_monto": 6000.0, "aforo_max_banco": 0.90, "aforo_total_max": 0.90, "comision_apertura_pct": 0.0, "relacion_ingreso_mensualidad": 1.82}, "tasas_perfil": {"1": {"tasa": 0.1325, "nombre": "Perfil 1 (muy alto)"}, "2": {"tasa": 0.1200, "nombre": "Perfil 2 (alto)"}, "3": {"tasa": 0.1125, "nombre": "Perfil 3 (medio)"}, "4": {"tasa": 0.1075, "nombre": "Perfil 4 (bueno)"}, "5": {"tasa": 0.1025, "nombre": "Perfil 5 (muy bueno)"}}, "requiere_perfilamiento": true}
7	Hipoteca Free Adquisición	santander_free_adq	2	{"tipo": "free", "nombre": "Hipoteca Free Adquisición", "politicas": {"seguros": {"modo": "incluidos", "suma_asegurable_pct": 0.70}, "notariales": {"pct": 0.07}, "avaluo_monto": 0.0, "aforo_max_banco": 0.90, "relacion_ingreso_mensualidad": 1.81818}, "tasas_perfil": {"1": {"tasa": 0.1235, "tasa_piso": 0.1035, "mes_inicio": 36, "reduccion_anual": 0.0025}, "2": {"tasa": 0.1210, "tasa_piso": 0.1035, "mes_inicio": 36, "reduccion_anual": 0.0025}, "3": {"tasa": 0.1185, "tasa_piso": 0.1035, "mes_inicio": 36, "reduccion_anual": 0.0025}, "4": {"tasa": 0.1160, "tasa_piso": 0.1035, "mes_inicio": 36, "reduccion_anual": 0.0025}, "5": {"tasa": 0.1135, "tasa_piso": 0.1035, "mes_inicio": 36, "reduccion_anual": 0.0025}}, "requiere_perfilamiento": true}
8	Hipoteca Santander Apoyo INFONAVIT	santander_apoyo	2	{"tipo": "apoyo", "nombre": "Hipoteca Santander Apoyo INFONAVIT", "politicas": {"seguros": {"modo": "cobrados", "vida": {"tarifa_pormil_mensual": 0.5154}, "danos": {"tarifa_pormil_mensual": 0.3000}}, "aforo_max_banco": 0.95, "aforo_total_max": 0.95, "relacion_ingreso_mensualidad": 1.82}}
9	Hipoteca Free Apoyo INFONAVIT	santander_free_apoyo	2	{"tipo": "apoyo", "nombre": "Hipoteca Free Apoyo INFONAVIT", "politicas": {"seguros": {"modo": "incluidos"}, "avaluo_monto": 0.0, "aforo_max_banco": 0.95, "aforo_total_max": 0.95, "relacion_ingreso_mensualidad": 1.81818}}
10	Hipoteca Santander Cofinavit	santander_cofinavit	2	{"tipo": "cofinavit", "nombre": "Hipoteca Santander Cofinavit", "politicas": {"seguros": {"modo": "cobrados", "vida": {"tarifa_pormil_mensual": 0.5154}}, "aforo_max_banco": 0.95, "aforo_total_max": 1.00, "relacion_ingreso_mensualidad": 1.82}}
11	Hipoteca Free Cofinavit	santander_free_cofinavit	2	{"tipo": "cofinavit", "nombre": "Hipoteca Free Cofinavit", "politicas": {"seguros": {"modo": "incluidos"}, "avaluo_monto": 0.0, "aforo_max_banco": 0.95, "aforo_total_max": 1.00, "relacion_ingreso_mensualidad": 1.81818}}
12	Scotiabank Valora	scotia_valora	3	{"tasas": [{"nombre": "Valora 12%", "aforo_max": 0.90, "cat_ref_pct": 14.5, "pago_millar_ref": 10.36, "tasa_anual_fija": 0.12, "enganche_min_pct": 0.05, "incremento_anual_pct": 0.0200}, {"nombre": "Valora 13%", "aforo_max": 0.90, "cat_ref_pct": 15.2, "pago_millar_ref": 11.28, "tasa_anual_fija": 0.13, "enganche_min_pct": 0.10, "incremento_anual_pct": 0.0140}, {"nombre": "Valora 14%", "aforo_max": 0.85, "cat_ref_pct": 16.2, "pago_millar_ref": 12.13, "tasa_anual_fija": 0.14, "enganche_min_pct": 0.15, "incremento_anual_pct": 0.0070}], "nombre": "Scotiabank Valora", "politicas": {"cat": {"incluye_comision_contratacion_t0": true}, "seguros": {"vida": {"monto_mensual": 1100.00}, "danos": {"monto_mensual": 600.00}}, "tipo_flujo": "creciente", "relacion_ir": 1.67, "avaluo_monto": 5750.00, "impuestos_pct": 0.03, "credito_minimo": 250000.00, "notariales_pct": 0.02, "delta_enganche_pct": 0.02, "valor_minimo_inmueble": 400000.00, "comision_contratacion_pct": 0.0125}}
13	Scotiabank Pagos Oportunos	scotia_pagos_op	3	{"tasas": [{"nombre": "Pagos Oportunos 7 años", "aforo_max": 0.95, "plazo_meses": 84, "tasa_anual_fija": 0.13, "incremento_anual_pct": 0.0}, {"nombre": "Pagos Oportunos 10 años", "aforo_max": 0.95, "plazo_meses": 120, "tasa_anual_fija": 0.128, "incremento_anual_pct": 0.0}, {"nombre": "Pagos Oportunos 15 años", "aforo_max": 0.95, "plazo_meses": 180, "tasa_anual_fija": 0.126, "incremento_anual_pct": 0.0}, {"nombre": "Pagos Oportunos 20 años", "aforo_max": 0.95, "plazo_meses": 240, "tasa_anual_fija": 0.124, "incremento_anual_pct": 0.0}], "nombre": "Scotiabank Pagos Oportunos", "politicas": {"cat": {"incluye_comision_contratacion_t0": true}, "seguros": {"vida": {"monto_mensual": 1100.00}, "danos": {"monto_mensual": 600.00}}, "tipo_flujo": "fijo", "relacion_ir": 1.67, "avaluo_monto": 5750.00, "delta_enganche_pct": 0.02, "comision_contratacion_pct": 0.0125}}
\.


--
-- Data for Name: mortgage_app_loanapplication; Type: TABLE DATA; Schema: public; Owner: admin_core
--

COPY public.mortgage_app_loanapplication (id, user_id, "annual_inc_MXN2025", "loan_amnt_MXN2025", "installment_MXN2025", dti, delinq_2yrs, inq_last_6mths, open_acc, pub_rec, "revol_bal_MXN2025", revol_util, total_acc, earliest_cr_line, "tot_cur_bal_MXN2025", "tot_coll_amt_MXN2025", "total_rev_hi_lim_MXN2025", home_ownership, verification_status, status, risk_label, created_at, collection_recovery_fee, collections_12_mths_ex_med, full_name, has_critical_warning, recoveries, risk_score, selected_product_id, warning_message, probabilities, applied_with_adjustment, requested_down_payment, is_rescue_mode_active, property_value, requested_term_months, calculated_cat, engine_dti_ratio, engine_ltv_ratio, suggested_down_payment, suggested_installment, suggested_loan_amount, user_accepted_suggestion, user_profile_data) FROM stdin;
\.


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 40, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, true);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 55, true);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 10, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 29, true);


--
-- Name: mortgage_app_bank_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.mortgage_app_bank_id_seq', 3, true);


--
-- Name: mortgage_app_bankproduct_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.mortgage_app_bankproduct_id_seq', 13, true);


--
-- Name: mortgage_app_loanapplication_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin_core
--

SELECT pg_catalog.setval('public.mortgage_app_loanapplication_id_seq', 1, false);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: mortgage_app_bank mortgage_app_bank_name_key; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_bank
    ADD CONSTRAINT mortgage_app_bank_name_key UNIQUE (name);


--
-- Name: mortgage_app_bank mortgage_app_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_bank
    ADD CONSTRAINT mortgage_app_bank_pkey PRIMARY KEY (id);


--
-- Name: mortgage_app_bank mortgage_app_bank_slug_key; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_bank
    ADD CONSTRAINT mortgage_app_bank_slug_key UNIQUE (slug);


--
-- Name: mortgage_app_bankproduct mortgage_app_bankproduct_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_bankproduct
    ADD CONSTRAINT mortgage_app_bankproduct_pkey PRIMARY KEY (id);


--
-- Name: mortgage_app_loanapplication mortgage_app_loanapplication_pkey; Type: CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_loanapplication
    ADD CONSTRAINT mortgage_app_loanapplication_pkey PRIMARY KEY (id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: mortgage_app_bank_name_7fc674b8_like; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX mortgage_app_bank_name_7fc674b8_like ON public.mortgage_app_bank USING btree (name varchar_pattern_ops);


--
-- Name: mortgage_app_bank_slug_93fe0634_like; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX mortgage_app_bank_slug_93fe0634_like ON public.mortgage_app_bank USING btree (slug varchar_pattern_ops);


--
-- Name: mortgage_app_bankproduct_bank_id_12b12621; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX mortgage_app_bankproduct_bank_id_12b12621 ON public.mortgage_app_bankproduct USING btree (bank_id);


--
-- Name: mortgage_app_loanapplication_selected_product_id_e4f31ad2; Type: INDEX; Schema: public; Owner: admin_core
--

CREATE INDEX mortgage_app_loanapplication_selected_product_id_e4f31ad2 ON public.mortgage_app_loanapplication USING btree (selected_product_id);


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: mortgage_app_bankproduct mortgage_app_bankpro_bank_id_12b12621_fk_mortgage_; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_bankproduct
    ADD CONSTRAINT mortgage_app_bankpro_bank_id_12b12621_fk_mortgage_ FOREIGN KEY (bank_id) REFERENCES public.mortgage_app_bank(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: mortgage_app_loanapplication mortgage_app_loanapp_selected_product_id_e4f31ad2_fk_mortgage_; Type: FK CONSTRAINT; Schema: public; Owner: admin_core
--

ALTER TABLE ONLY public.mortgage_app_loanapplication
    ADD CONSTRAINT mortgage_app_loanapp_selected_product_id_e4f31ad2_fk_mortgage_ FOREIGN KEY (selected_product_id) REFERENCES public.mortgage_app_bankproduct(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict aBV7FERbI9K2VTn38dB0yfUMhNPRQyscB5WDFZsqHoOqRLyskcW4yuXejbcWtzM

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

\restrict dwj6oeOURhfVwVqaOFGxLBaB95YPkriee46W4B1izJTM7NXoPpaqNzcznIPRB6S

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: admin_core
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO admin_core;

\unrestrict dwj6oeOURhfVwVqaOFGxLBaB95YPkriee46W4B1izJTM7NXoPpaqNzcznIPRB6S
\connect postgres
\restrict dwj6oeOURhfVwVqaOFGxLBaB95YPkriee46W4B1izJTM7NXoPpaqNzcznIPRB6S

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
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: admin_core
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- PostgreSQL database dump complete
--

\unrestrict dwj6oeOURhfVwVqaOFGxLBaB95YPkriee46W4B1izJTM7NXoPpaqNzcznIPRB6S

--
-- PostgreSQL database cluster dump complete
--

