CREATE TABLE "penduduk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nik" text NOT NULL,
	"no_kk" text NOT NULL,
	"nama_lengkap" varchar(255) NOT NULL,
	"tempat_lahir" varchar(100) NOT NULL,
	"tanggal_lahir" date NOT NULL,
	"jenis_kelamin" varchar(20) NOT NULL,
	"alamat" varchar(255) NOT NULL,
	"rt" varchar(5) NOT NULL,
	"rw" varchar(5) NOT NULL,
	"agama" varchar(50) NOT NULL,
	"status_perkawinan" varchar(50) NOT NULL,
	"pekerjaan" varchar(100)
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;