import * as z from "zod"

export const userSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username hanya boleh huruf, angka, underscore, titik, dan strip"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "user"], {
    required_error: "Pilih peran (role) pengguna",
  }),
  rt: z.string().optional(),
  rw: z.string().optional(),
})

export const profileSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["admin", "user"]),
  rt: z.string().optional(),
  rw: z.string().optional(),
})

export const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

export type UserFormValues = z.infer<typeof userSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
export type PasswordFormValues = z.infer<typeof passwordSchema>
