"use client"

import { Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTambahAnggotaKk } from "./use-tambah-anggota-kk"
import { KkAnggotaFormFields } from "./kk-anggota-form-fields"

interface KkTambahAnggotaCardProps {
  kkId: string
  nextUrutan: number
  onSuccess: () => void
  onCancel: () => void
}

export function KkTambahAnggotaCard({
  kkId,
  nextUrutan,
  onSuccess,
  onCancel,
}: KkTambahAnggotaCardProps) {
  const {
    form,
    isLoading,
    mode,
    setMode,
    candidateList,
    candidateSearch,
    setCandidateSearch,
    selectedCandidate,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    handleSelectCandidate,
    onSubmit,
    resetForm,
  } = useTambahAnggotaKk(kkId, nextUrutan, onSuccess)

  const { handleSubmit } = form

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  return (
    <Card className="border-2 border-primary/30 shadow-md transition-all">
      <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Formulir Anggota Keluarga</CardTitle>
          <CardDescription>
            Pilih data penduduk yang akan didaftarkan ke Kartu Keluarga.
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCancel} title="Tutup formulir">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <KkAnggotaFormFields
            form={form}
            mode={mode}
            setMode={setMode}
            candidateList={candidateList}
            candidateSearch={candidateSearch}
            setCandidateSearch={setCandidateSearch}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={handleSelectCandidate}
            previewUrl={previewUrl}
            onFileSelect={(file, url) => {
              setSelectedFile(file)
              setPreviewUrl(url)
            }}
            onRemovePreview={() => {
              setSelectedFile(null)
              setPreviewUrl(null)
            }}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Anggota KK
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
