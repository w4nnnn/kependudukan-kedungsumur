"use client"

import { ShieldAlert, Ban, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserDetail } from "./types"

interface PenggunaEditBanCardProps {
  userData: UserDetail
  isSelf: boolean
  isUpdatingBan: boolean
  banReasonInput: string
  setBanReasonInput: (val: string) => void
  onToggleBan: () => void
}

export function PenggunaEditBanCard({
  userData,
  isSelf,
  isUpdatingBan,
  banReasonInput,
  setBanReasonInput,
  onToggleBan,
}: PenggunaEditBanCardProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <CardTitle>Status Akun & Hak Akses</CardTitle>
            <CardDescription>
              Blokir sementara atau aktifkan kembali akses akun ke dalam sistem.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border p-4 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">
                Status Saat Ini:{" "}
                <span className={userData.banned ? "text-destructive" : "text-emerald-500"}>
                  {userData.banned ? "Diblokir (Banned)" : "Aktif (Active)"}
                </span>
              </p>
              {userData.banned && userData.banReason && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Alasan Pemblokiran: <em>&quot;{userData.banReason}&quot;</em>
                </p>
              )}
            </div>

            <Button
              type="button"
              variant={userData.banned ? "outline" : "destructive"}
              disabled={isUpdatingBan || isSelf}
              onClick={onToggleBan}
              className="gap-2 shrink-0"
            >
              {isUpdatingBan ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : userData.banned ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              {userData.banned ? "Buka Blokir Akun" : "Blokir Akun"}
            </Button>
          </div>

          {!userData.banned && (
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-xs font-medium text-muted-foreground">
                Alasan Pemblokiran (Wajib jika memblokir)
              </label>
              <Input
                placeholder="Contoh: Pelanggaran wewenang atau permohonan mutasi dinas"
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                disabled={isSelf}
              />
            </div>
          )}

          {isSelf && (
            <p className="text-xs text-muted-foreground italic">
              * Anda tidak dapat memblokir akun Anda sendiri.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
