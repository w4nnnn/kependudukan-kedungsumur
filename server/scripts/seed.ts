import { auth } from "../src/lib/auth.js";
import { db } from "../src/db/index.js";
import { user } from "../src/db/schema/auth-schema.js";
import { eq } from "drizzle-orm";

async function seedSuperAdmin() {
  console.log("Mulai membuat Super Admin...");
  
  try {
    const newUser = await auth.api.signUpEmail({
      body: {
        email: "superadmin@kedungsumur.desa.id",
        password: "PasswordRahasia123!",
        name: "Super Administrator",
        username: "superadmin",
      }
    });

    if (newUser?.user) {
      await db.update(user).set({ role: "admin" }).where(eq(user.id, newUser.user.id));
      console.log("Berhasil membuat Super Admin:", newUser.user.username);
    }
  } catch (error) {
    console.error("Gagal membuat Super Admin:", error);
  }
}

seedSuperAdmin();