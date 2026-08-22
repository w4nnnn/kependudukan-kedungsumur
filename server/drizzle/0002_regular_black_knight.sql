ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "nik_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "no_kk_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "foto" varchar(500);--> statement-breakpoint
CREATE INDEX "idx_penduduk_nama" ON "penduduk" USING btree ("nama_lengkap");--> statement-breakpoint
CREATE INDEX "idx_penduduk_rt_rw" ON "penduduk" USING btree ("rt","rw");--> statement-breakpoint
CREATE INDEX "idx_penduduk_nokk_hash" ON "penduduk" USING btree ("no_kk_hash");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "penduduk" ADD CONSTRAINT "penduduk_nik_hash_unique" UNIQUE("nik_hash");