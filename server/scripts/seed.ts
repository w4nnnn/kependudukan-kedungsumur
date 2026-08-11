import { auth } from "../src/lib/auth.js";
import { db } from "../src/db/index.js";
import { user } from "../src/db/schema/auth-schema.js";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function seedSuperAdmin() {
  console.log("Mulai membuat Super Admin...");
  
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;
  
  if (!superAdminPassword) {
    console.error("❌ GAGAL: SUPERADMIN_PASSWORD tidak ditemukan di file .env");
    console.error("Silakan tambahkan SUPERADMIN_PASSWORD=SandiKuatAnda di file .env terlebih dahulu.");
    process.exit(1);
  }

  try {
    const newUser = await auth.api.signUpEmail({
      body: {
        email: "superadmin@kedungsumur.desa.id",
        password: superAdminPassword,
        name: "Super Administrator",
        username: "superadmin",
      }
    });

    if (newUser?.user) {
      await db.update(user).set({ role: "admin" }).where(eq(user.id, newUser.user.id));
      console.log("✅ Berhasil membuat Super Admin:", newUser.user.username);
    }
  } catch (error: any) {
    if (error?.message?.includes("already exists") || error?.body?.message?.includes("exists")) {
      console.log("⚠️ Super Admin sudah ada di database, melewati proses seeding.");
    } else {
      console.error("❌ Gagal membuat Super Admin:", error);
    }
  }
}

seedSuperAdmin();