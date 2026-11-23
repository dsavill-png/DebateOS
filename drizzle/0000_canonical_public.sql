CREATE TABLE "warehouse_captures" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"source_method" text NOT NULL,
	"route" text NOT NULL,
	"request_scope" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"status" integer NOT NULL,
	"media_type" text NOT NULL,
	"response_digest" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"authorization_class" text NOT NULL,
	"purpose" text NOT NULL,
	"grant_scope" text,
	"audience" text NOT NULL,
	"retention_policy" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"category_source_id" text NOT NULL,
	CONSTRAINT "categories_identity_key" UNIQUE("provider","tournament_source_id","category_source_id")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"chapter_source_id" text NOT NULL,
	CONSTRAINT "chapters_identity_key" UNIQUE("provider","chapter_source_id")
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"event_source_id" text NOT NULL,
	"entry_source_id" text NOT NULL,
	CONSTRAINT "entries_identity_key" UNIQUE("provider","tournament_source_id","event_source_id","entry_source_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"event_source_id" text NOT NULL,
	CONSTRAINT "events_identity_key" UNIQUE("provider","tournament_source_id","event_source_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" text NOT NULL,
	"parser_version" integer NOT NULL,
	"source_pointer" text NOT NULL,
	"output_role" text NOT NULL,
	"subject_id" uuid,
	"raw_source_id" jsonb,
	"observed_value" jsonb,
	"verification" text NOT NULL,
	"observation_state" text NOT NULL,
	"authorization_class" text NOT NULL,
	"purpose" text NOT NULL,
	"grant_scope" text,
	"audience" text NOT NULL,
	"retention_policy" text NOT NULL,
	CONSTRAINT "captures_identity_key" UNIQUE("snapshot_id","parser_version","source_pointer","output_role")
);
--> statement-breakpoint
CREATE TABLE "judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"judge_source_id" text NOT NULL,
	CONSTRAINT "judges_identity_key" UNIQUE("provider","tournament_source_id","judge_source_id")
);
--> statement-breakpoint
CREATE TABLE "panel_judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panel_id" uuid NOT NULL,
	"judge_id" uuid NOT NULL,
	CONSTRAINT "panelJudges_identity_key" UNIQUE("panel_id","judge_id")
);
--> statement-breakpoint
CREATE TABLE "panels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"event_source_id" text NOT NULL,
	"round_source_id" text NOT NULL,
	"panel_source_id" text NOT NULL,
	CONSTRAINT "panels_identity_key" UNIQUE("provider","tournament_source_id","event_source_id","round_source_id","panel_source_id")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"person_source_id" text NOT NULL,
	CONSTRAINT "persons_identity_key" UNIQUE("provider","person_source_id")
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"event_source_id" text NOT NULL,
	"round_source_id" text NOT NULL,
	CONSTRAINT "rounds_identity_key" UNIQUE("provider","tournament_source_id","event_source_id","round_source_id")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"school_source_id" text NOT NULL,
	CONSTRAINT "schools_identity_key" UNIQUE("provider","tournament_source_id","school_source_id")
);
--> statement-breakpoint
CREATE TABLE "season_membership_evidence" (
	"membership_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	CONSTRAINT "seasonMembershipEvidence_identity_key" UNIQUE("membership_id","evidence_id")
);
--> statement-breakpoint
CREATE TABLE "season_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"rationale" text NOT NULL,
	"classification" jsonb NOT NULL,
	CONSTRAINT "seasonScopes_identity_key" UNIQUE("revision_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "season_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_id" text NOT NULL,
	"version" integer NOT NULL,
	"predecessor_version" integer,
	"definition" jsonb NOT NULL,
	"approved_by" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_revisions_scope_id_version_unique" UNIQUE("scope_id","version")
);
--> statement-breakpoint
CREATE TABLE "season_scopes" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"school_source_id" text NOT NULL,
	"student_source_id" text NOT NULL,
	CONSTRAINT "students_identity_key" UNIQUE("provider","tournament_source_id","school_source_id","student_source_id")
);
--> statement-breakpoint
CREATE TABLE "timeslots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	"timeslot_source_id" text NOT NULL,
	CONSTRAINT "timeslots_identity_key" UNIQUE("provider","tournament_source_id","timeslot_source_id")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"tournament_source_id" text NOT NULL,
	CONSTRAINT "tournaments_identity_key" UNIQUE("provider","tournament_source_id")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_provider_tournament_source_id_tournaments_provider_tournament_source_id_fk" FOREIGN KEY ("provider","tournament_source_id") REFERENCES "public"."tournaments"("provider","tournament_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_provider_tournament_source_id_event_source_id_events_provider_tournament_source_id_event_source_id_fk" FOREIGN KEY ("provider","tournament_source_id","event_source_id") REFERENCES "public"."events"("provider","tournament_source_id","event_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_provider_tournament_source_id_tournaments_provider_tournament_source_id_fk" FOREIGN KEY ("provider","tournament_source_id") REFERENCES "public"."tournaments"("provider","tournament_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence" ADD CONSTRAINT "warehouse_evidence_snapshot_id_warehouse_captures_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."warehouse_captures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judges" ADD CONSTRAINT "judges_provider_tournament_source_id_tournaments_provider_tournament_source_id_fk" FOREIGN KEY ("provider","tournament_source_id") REFERENCES "public"."tournaments"("provider","tournament_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_judges" ADD CONSTRAINT "panel_judges_panel_id_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "public"."panels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_judges" ADD CONSTRAINT "panel_judges_judge_id_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panels" ADD CONSTRAINT "panels_provider_tournament_source_id_event_source_id_round_source_id_rounds_provider_tournament_source_id_event_source_id_round_source_id_fk" FOREIGN KEY ("provider","tournament_source_id","event_source_id","round_source_id") REFERENCES "public"."rounds"("provider","tournament_source_id","event_source_id","round_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_provider_tournament_source_id_event_source_id_events_provider_tournament_source_id_event_source_id_fk" FOREIGN KEY ("provider","tournament_source_id","event_source_id") REFERENCES "public"."events"("provider","tournament_source_id","event_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_provider_tournament_source_id_tournaments_provider_tournament_source_id_fk" FOREIGN KEY ("provider","tournament_source_id") REFERENCES "public"."tournaments"("provider","tournament_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_membership_evidence" ADD CONSTRAINT "season_membership_evidence_membership_id_season_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."season_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_membership_evidence" ADD CONSTRAINT "season_membership_evidence_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."warehouse_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_memberships" ADD CONSTRAINT "season_memberships_revision_id_season_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."season_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_memberships" ADD CONSTRAINT "season_memberships_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_revisions" ADD CONSTRAINT "season_revisions_scope_id_season_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."season_scopes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_revisions" ADD CONSTRAINT "season_revisions_scope_id_predecessor_version_season_revisions_scope_id_version_fk" FOREIGN KEY ("scope_id","predecessor_version") REFERENCES "public"."season_revisions"("scope_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_provider_tournament_source_id_school_source_id_schools_provider_tournament_source_id_school_source_id_fk" FOREIGN KEY ("provider","tournament_source_id","school_source_id") REFERENCES "public"."schools"("provider","tournament_source_id","school_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeslots" ADD CONSTRAINT "timeslots_provider_tournament_source_id_tournaments_provider_tournament_source_id_fk" FOREIGN KEY ("provider","tournament_source_id") REFERENCES "public"."tournaments"("provider","tournament_source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."warehouse_public_evidence" AS (select "warehouse_evidence"."id", "warehouse_evidence"."snapshot_id", "warehouse_evidence"."parser_version", "warehouse_evidence"."source_pointer", "warehouse_evidence"."output_role", "warehouse_evidence"."subject_id", "warehouse_evidence"."raw_source_id", "warehouse_evidence"."observed_value", "warehouse_evidence"."verification", "warehouse_evidence"."observation_state" from "warehouse_evidence" inner join "warehouse_captures" on "warehouse_evidence"."snapshot_id" = "warehouse_captures"."id" where "warehouse_evidence"."authorization_class" = 'public' and "warehouse_evidence"."audience" = 'public'
    and "warehouse_evidence"."grant_scope" is null and "warehouse_captures"."authorization_class" = 'public'
    and "warehouse_captures"."audience" = 'public' and "warehouse_captures"."grant_scope" is null);