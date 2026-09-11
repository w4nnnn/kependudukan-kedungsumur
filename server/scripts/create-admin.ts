import { auth } from "../src/lib/auth.js";
import { db } from "../src/db/index.js";
import { user } from "../src/db/schema/auth-schema.js";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function seedSuperAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("❌ GAGAL: Argumen tidak lengkap.");
    console.error("Cara penggunaan: npm run seed <name> <username> <password>");
    console.error("Contoh: npm run seed 'Admin Desa' admin_desa sandi_rahasia_123");
    process.exit(1);
  }

  const name = args[0] as string;
  const username = args[1] as string;
  const password = args[2] as string;
  
  console.log(`Mulai membuat Super Admin dengan username: ${username}...`);

  try {
    const newUser = await auth.api.createUser({
      body: {
        email: `${username}@kedungsumur.desa.id`,
        password: password,
        name: name,
        role: "admin",
        data: {
          username: username,
        },
      }
    });

    if (newUser?.user) {
      await db.update(user).set({ role: "admin" }).where(eq(user.id, newUser.user.id));
      console.log("✅ Berhasil membuat Super Admin:", (newUser.user as any).username || username);
    }
  } catch (error: any) {
    if (error?.message?.includes("already exists") || error?.body?.message?.includes("exists")) {
      console.log(`⚠️ User '${username}' atau email tersebut sudah ada di database, melewati proses seeding.`);
    } else {
      console.error("❌ Gagal membuat Super Admin:", error);
    }
  }
}

seedSuperAdmin();