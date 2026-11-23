CREATE TABLE "warehouse_evidence_relationships" (
	"evidence_id" uuid PRIMARY KEY NOT NULL,
	"parent_evidence_id" uuid,
	"category_id" uuid,
	"event_id" uuid,
	"school_id" uuid,
	"chapter_id" uuid,
	"entry_id" uuid,
	"student_id" uuid,
	"round_id" uuid,
	"panel_id" uuid,
	"judge_id" uuid,
	"person_id" uuid
);
--> statement-breakpoint
CREATE TABLE "warehouse_operation_outcomes" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"operation" text NOT NULL,
	"route" text,
	"request_scope" jsonb NOT NULL,
	"attempted_at" timestamp with time zone NOT NULL,
	"status" integer,
	"media_type" text,
	"snapshot_id" text,
	"outcome" text NOT NULL,
	CONSTRAINT "warehouse_operation_outcome_allowed" CHECK ("warehouse_operation_outcomes"."outcome" in
  ('observed', 'empty', 'not-requested', 'unpublished', 'unauthorized', 'forbidden',
   'ambiguous-not-found', 'invalid', 'rate-limited', 'transient-failure'))
);
--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."warehouse_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_parent_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("parent_evidence_id") REFERENCES "public"."warehouse_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_panel_id_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "public"."panels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_judge_id_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_evidence_relationships" ADD CONSTRAINT "warehouse_evidence_relationships_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_operation_outcomes" ADD CONSTRAINT "warehouse_operation_outcomes_snapshot_id_warehouse_captures_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."warehouse_captures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."warehouse_public_evidence" AS (select "warehouse_evidence"."id", "warehouse_evidence"."snapshot_id", "warehouse_evidence"."parser_version", "warehouse_evidence"."source_pointer", "warehouse_evidence"."output_role", "warehouse_evidence"."subject_id", case when "warehouse_evidence"."output_role" in ('ballot-score', 'standing', 'standing-value', 'result-set') then null else "warehouse_evidence"."raw_source_id" end as "raw_source_id", case "warehouse_evidence"."output_role"
    when 'ballot-score' then jsonb_strip_nulls(jsonb_build_object('id' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'id') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'id') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'id' end, 'value' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'value') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'value') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'value' end)) || case when "warehouse_evidence"."observed_value"->>'tag' = 'speaker' then '{"tag":"speaker"}'::jsonb else '{}'::jsonb end
    when 'standing' then jsonb_strip_nulls(jsonb_build_object('place' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'place') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'place') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'place' end, 'rank' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'rank') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'rank') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'rank' end, 'percentile' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'percentile') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'percentile') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'percentile' end))
    when 'standing-value' then jsonb_strip_nulls(jsonb_build_object('result_key' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'result_key') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'result_key') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'result_key' end, 'value' , case when jsonb_typeof("warehouse_evidence"."observed_value"->'value') in ('number', 'string')
    and ("warehouse_evidence"."observed_value"->>'value') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then "warehouse_evidence"."observed_value"->'value' end))
    when 'result-sets' then null
    when 'result-set' then null
    when 'result-set-publication' then case when "warehouse_evidence"."observed_value" in ('true', 'false', '"true"', '"false"') then "warehouse_evidence"."observed_value" end
    when 'ballot-scores' then null
    when 'ballot' then case when ("warehouse_evidence"."observed_value"#>>'{row,score}') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$'
      and jsonb_typeof("warehouse_evidence"."observed_value"#>'{row,score}') in ('number', 'string')
      then "warehouse_evidence"."observed_value" else "warehouse_evidence"."observed_value" #- '{row,score}' end
    else "warehouse_evidence"."observed_value" end as "observed_value", "warehouse_evidence"."verification", "warehouse_evidence"."observation_state" from "warehouse_evidence" inner join "warehouse_captures" on "warehouse_evidence"."snapshot_id" = "warehouse_captures"."id" where "warehouse_evidence"."authorization_class" = 'public' and "warehouse_evidence"."audience" = 'public'
    and "warehouse_evidence"."grant_scope" is null and "warehouse_captures"."authorization_class" = 'public'
    and "warehouse_captures"."audience" = 'public' and "warehouse_captures"."grant_scope" is null);
