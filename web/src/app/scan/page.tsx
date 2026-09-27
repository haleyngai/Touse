'use client'
export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, ScanLine, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Room } from '@/types'

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

const TIPS = [
  'Capture the full room from one corner',
  'Good lighting — natural light works best',
  'Include floor and at least two walls',
  'JPG, PNG, WebP or HEIC · max 10 MB',
]

function getStatusLabel(state: UploadState): string {
  if (state === 'uploading') return 'UPLOADING...'
  if (state === 'analyzing') return 'ANALYZING ROOM...'
  if (state === 'done') return 'ANALYSIS COMPLETE'
  return ''
}

export default function ScanPage() {
  const router = useRouter()
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, HEIC).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.')
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
    setState('uploading')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const room = await api.upload<Room>('/rooms/upload', formData)
      setState('analyzing')
      await api.post(`/rooms/${room.id}/analyze`, {})
      api.post(`/rooms/${room.id}/designs`, {}).catch(() => {})
      setState('done')
      setTimeout(() => router.push(`/designs?room=${room.id}`), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setState('error')
    }
  }, [router])

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) handleFile(files[0])
  }, [handleFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    disabled: state === 'uploading' || state === 'analyzing',
  })

  const isProcessing = state === 'uploading' || state === 'analyzing'

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col">

      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-5 border-b border-white/8 safe-top">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white/40 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">Touse</p>
          <p className="font-display font-bold uppercase tracking-tight text-white text-lg leading-tight">SCAN ROOM</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8 max-w-lg mx-auto w-full">

        {/* Primary camera input — mobile first */}
        <label className="w-full cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            disabled={isProcessing}
          />
          <div className={cn(
            'relative w-full border-2 border-dashed flex flex-col items-center justify-center gap-5 transition-all duration-300 overflow-hidden',
            isProcessing ? 'border-[#DB4A2B]/50 bg-[#DB4A2B]/5' : 'border-white/12 hover:border-white/30 bg-white/[0.03]',
            preview ? 'p-0' : 'p-14'
          )}>
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Room preview" className="w-full h-60 object-cover" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-[#1E1E1E]/60 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-[#DB4A2B] animate-spin-slow" />
                    <p className="font-display font-bold uppercase text-sm tracking-tight text-white">
                      {getStatusLabel(state)}
                    </p>
                  </div>
                )}
                {state === 'done' && (
                  <div className="absolute inset-0 bg-[#1E1E1E]/60 flex flex-col items-center justify-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <p className="font-display font-bold uppercase text-sm tracking-tight text-green-400">
                      {getStatusLabel(state)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <ScanLine className="w-10 h-10 text-white/20 group-hover:text-white/35 transition-colors" />
                <div className="text-center">
                  <p className="font-display font-bold uppercase text-xl tracking-tight text-white">
                    TAP TO PHOTOGRAPH
                  </p>
                  <p className="text-sm text-white/30 mt-1.5">Point at an empty room</p>
                </div>
              </>
            )}
          </div>
        </label>

        {/* Desktop drag-drop */}
        <div className="w-full hidden sm:block">
          <div
            {...getRootProps()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 border border-dashed p-8 cursor-pointer transition-all',
              isDragActive ? 'border-[#DB4A2B]/50 bg-[#DB4A2B]/5' : 'border-white/10 hover:border-white/22',
              isProcessing && 'opacity-30 pointer-events-none'
            )}
          >
            <input {...getInputProps()} />
            {isDragActive
              ? <Image className="w-6 h-6 text-[#DB4A2B]" />
              : <Upload className="w-6 h-6 text-white/22" />
            }
            <p className="text-sm text-white/30 text-center">
              {isDragActive ? 'Drop to upload' : 'Or drag and drop a room photo'}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full flex items-start gap-3 border border-red-500/30 bg-red-500/8 px-4 py-3 animate-slide-up">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Tips */}
        <div className="w-full">
          <p className="rf-label text-white/25 mb-5">FOR BEST RESULTS</p>
          <ul className="space-y-3.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white/35">
                <span className="w-5 h-px bg-[#DB4A2B] shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
