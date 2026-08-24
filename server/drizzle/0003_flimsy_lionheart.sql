CREATE TABLE "kartu_keluarga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"no_kk" text NOT NULL,
	"no_kk_hash" varchar(64) NOT NULL,
	"kepala_keluarga_id" uuid,
	"alamat" varchar(255) NOT NULL,
	"rt" varchar(5) NOT NULL,
	"rw" varchar(5) NOT NULL,
	"dusun" varchar(100),
	"kode_pos" varchar(10),
	"tanggal_dikeluarkan" date,
	CONSTRAINT "kartu_keluarga_no_kk_hash_unique" UNIQUE("no_kk_hash")
);
--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "kartu_keluarga_id" uuid;--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "shdk" varchar(50) DEFAULT 'KEPALA KELUARGA' NOT NULL;--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "urutan_kk" varchar(5) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "nama_ayah" varchar(255);--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "nama_ibu" varchar(255);--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "pendidikan" varchar(100);--> statement-breakpoint
ALTER TABLE "penduduk" ADD COLUMN "golongan_darah" varchar(5);--> statement-breakpoint
CREATE INDEX "idx_kk_nokk_hash" ON "kartu_keluarga" USING btree ("no_kk_hash");--> statement-breakpoint
CREATE INDEX "idx_kk_rt_rw" ON "kartu_keluarga" USING btree ("rt","rw");--> statement-breakpoint
ALTER TABLE "penduduk" ADD CONSTRAINT "penduduk_kartu_keluarga_id_kartu_keluarga_id_fk" FOREIGN KEY ("kartu_keluarga_id") REFERENCES "public"."kartu_keluarga"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_penduduk_kk_id" ON "penduduk" USING btree ("kartu_keluarga_id");