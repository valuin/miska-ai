CREATE TABLE IF NOT EXISTS "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"auth_type" varchar(255) DEFAULT 'none' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"redirect_url" text,
	CONSTRAINT "integrations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"integration_id" uuid NOT NULL,
	"authenticated" boolean DEFAULT false NOT NULL,
	"account_label" text,
	"connected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_integration_id" uuid NOT NULL,
	"key" varchar(255) NOT NULL,
	"value_encrypted" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Stream" DROP CONSTRAINT "Stream_id_pk";--> statement-breakpoint
ALTER TABLE "Stream" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "phone_number" varchar(15);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "whatsapp_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_integration_id_user_integrations_id_fk" FOREIGN KEY ("user_integration_id") REFERENCES "public"."user_integrations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_integration_user_id_idx" ON "user_integrations" USING btree ("user_id","integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "integration_key_idx" ON "auth_credentials" USING btree ("user_integration_id","key");