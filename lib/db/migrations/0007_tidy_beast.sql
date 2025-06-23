CREATE SCHEMA "mastra";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mastra"."eval_datasets" (
	"input" text NOT NULL,
	"output" text NOT NULL,
	"result" jsonb NOT NULL,
	"agent_name" text NOT NULL,
	"metric_name" text NOT NULL,
	"instructions" text NOT NULL,
	"test_info" jsonb NOT NULL,
	"global_run_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mastra"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"resourceId" uuid,
	"content" text NOT NULL,
	"role" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mastra"."threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resourceId" text NOT NULL,
	"title" text NOT NULL,
	"metadata" text DEFAULT '{}',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mastra"."traces" (
	"id" text PRIMARY KEY NOT NULL,
	"parentSpanId" text,
	"name" text NOT NULL,
	"traceId" text NOT NULL,
	"scope" text NOT NULL,
	"kind" integer NOT NULL,
	"attributes" jsonb,
	"status" jsonb,
	"events" jsonb,
	"links" jsonb,
	"other" text,
	"startTime" bigint NOT NULL,
	"endTime" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mastra"."workflows" (
	"workflow_name" text NOT NULL,
	"run_id" uuid NOT NULL,
	"snapshot" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflows_workflow_name_run_id_pk" PRIMARY KEY("workflow_name","run_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mastra"."messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "mastra"."threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
