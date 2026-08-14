import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin } from "better-auth/plugins";
import { db } from "../db/index.js";
import * as authSchema from "../db/schema/auth-schema.js"; // Import schema Better Auth

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema, // Berikan schema ke adapter
    }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [
        "http://localhost:3000"
    ],
    plugins: [
        username(),
        admin()
    ]
});