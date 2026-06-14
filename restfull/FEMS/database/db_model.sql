CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "role" varchar(20) NOT NULL DEFAULT 'user',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY,
  "customer_code" varchar(20) UNIQUE NOT NULL,
  "full_name" varchar(200) NOT NULL,
  "national_id" varchar(50) UNIQUE,
  "phone" varchar(30) NOT NULL,
  "email" varchar(255),
  "address" text,
  "organization_name" varchar(200),
  "is_active" boolean DEFAULT true,
  "created_by" uuid,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "extinguishers" (
  "id" uuid PRIMARY KEY,
  "extinguisher_code" varchar(30) UNIQUE NOT NULL,
  "serial_number" varchar(100) UNIQUE NOT NULL,
  "type" varchar(30) NOT NULL,
  "size" varchar(20) NOT NULL,
  "capacity_liters" float,
  "manufacture_date" date NOT NULL,
  "purchase_date" date NOT NULL,
  "installation_date" date NOT NULL,
  "expiry_date" date NOT NULL,
  "last_inspection_date" date,
  "next_inspection_date" date,
  "location" varchar(300) NOT NULL,
  "customer_id" uuid NOT NULL,
  "status" varchar(30) DEFAULT 'active',
  "compliance_status" varchar(30) DEFAULT 'compliant',
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "inspections" (
  "id" uuid PRIMARY KEY,
  "extinguisher_id" uuid NOT NULL,
  "inspector_id" uuid,
  "inspector_name" varchar(200) NOT NULL,
  "inspection_date" date NOT NULL,
  "inspection_time" varchar(10),
  "findings" text,
  "status" varchar(30) NOT NULL,
  "next_inspection_date" date,
  "created_by" uuid,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "maintenance" (
  "id" uuid PRIMARY KEY,
  "extinguisher_id" uuid NOT NULL,
  "service_date" date NOT NULL,
  "service_company" varchar(200) NOT NULL,
  "technician_name" varchar(200) NOT NULL,
  "action_taken" varchar(255),
  "issues_identified" text,
  "recommendations" text,
  "next_service_date" date,
  "cost" float DEFAULT 0,
  "description" text,
  "status" varchar(30) DEFAULT 'completed',
  "created_by" uuid,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "customer_id" uuid,
  "extinguisher_id" uuid,
  "user_id" uuid,
  "type" varchar(50) NOT NULL,
  "title" varchar(300) NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean DEFAULT false,
  "email_sent" boolean DEFAULT false,
  "email_sent_at" timestamp,
  "days_until_expiry" int,
  "escalation_stage" int DEFAULT 0,
  "recipient_email" varchar(255),
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "escalations" (
  "id" uuid PRIMARY KEY,
  "extinguisher_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "stage" int NOT NULL,
  "reason" text NOT NULL,
  "status" varchar(30) DEFAULT 'open',
  "resolved_at" timestamp,
  "resolved_by" uuid,
  "notes" text,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "otps" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "email" varchar(255) NOT NULL,
  "code" varchar(6) NOT NULL,
  "purpose" varchar(30) DEFAULT 'password_reset',
  "is_used" boolean DEFAULT false,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "user_email" varchar(255),
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(50),
  "entity_id" uuid,
  "old_values" text,
  "new_values" text,
  "ip_address" varchar(50),
  "user_agent" text,
  "created_at" timestamp DEFAULT (now())
);

COMMENT ON COLUMN "users"."id" IS 'uuid_generate_v4()';

COMMENT ON COLUMN "users"."role" IS 'admin | inspector | user';

COMMENT ON COLUMN "extinguishers"."type" IS 'Water | CO2 | Foam | Dry Chemical';

COMMENT ON COLUMN "extinguishers"."size" IS '2.5 lb | 5 lb | 9 lb | 12 lb';

COMMENT ON COLUMN "extinguishers"."status" IS 'active | expired | serviced | decommissioned | pending_inspection';

COMMENT ON COLUMN "extinguishers"."compliance_status" IS 'compliant | non_compliant | warning | critical';

COMMENT ON COLUMN "inspections"."status" IS 'Scheduled | Completed | Requires Service | Failed';

COMMENT ON COLUMN "maintenance"."status" IS 'scheduled | in_progress | completed | cancelled';

COMMENT ON COLUMN "notifications"."type" IS 'expiry_alert | inspection_due | service_due | compliance_violation | escalation | general';

COMMENT ON COLUMN "escalations"."stage" IS '1 to 5';

COMMENT ON COLUMN "escalations"."status" IS 'open | acknowledged | resolved | closed';

COMMENT ON COLUMN "otps"."purpose" IS 'password_reset | email_verify';

ALTER TABLE "customers" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "extinguishers" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "extinguishers" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inspections" ADD FOREIGN KEY ("extinguisher_id") REFERENCES "extinguishers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inspections" ADD FOREIGN KEY ("inspector_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inspections" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "maintenance" ADD FOREIGN KEY ("extinguisher_id") REFERENCES "extinguishers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "maintenance" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("extinguisher_id") REFERENCES "extinguishers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "escalations" ADD FOREIGN KEY ("extinguisher_id") REFERENCES "extinguishers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "escalations" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "escalations" ADD FOREIGN KEY ("resolved_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "otps" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
