import { ClientOnly } from '@tanstack/react-router'
import { lazy } from 'react'
import { FileTabs } from '@/components/file-tabs'
import { EditorFallback } from './fallback'

const CodeMirrorEditor = lazy(() => import('./editor'))

export default function MarkdownEditor() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-editor">
      <FileTabs />
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <ClientOnly fallback={<EditorFallback />}>
          <CodeMirrorEditor />
        </ClientOnly>
      </div>
    </div>
  )
}
