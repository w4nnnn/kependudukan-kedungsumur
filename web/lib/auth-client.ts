import { createAuthClient } from "better-auth/react"
import { usernameClient, adminClient } from "better-auth/client/plugins"
import { API_BASE_URL } from "@/lib/config"

export const authClient = createAuthClient({
    baseURL: API_BASE_URL,
    plugins: [
        usernameClient(),
        adminClient()
    ]
})

