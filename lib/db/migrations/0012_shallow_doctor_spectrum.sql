DROP TABLE "Vote_v2";--> statement-breakpoint
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_messageId_Message_id_fk";
--> statement-breakpoint
ALTER TABLE "temp_documents" ALTER COLUMN "expires_at" SET DEFAULT '2025-06-30T03:43:30.314Z';--> statement-breakpoint
ALTER TABLE "Message_v2" ADD COLUMN "agentName" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
