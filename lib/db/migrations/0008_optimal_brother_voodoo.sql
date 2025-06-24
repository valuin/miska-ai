CREATE TABLE IF NOT EXISTS "Upload" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Upload_id_createdAt_pk" PRIMARY KEY("id","createdAt")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
