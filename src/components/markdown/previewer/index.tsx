import { ClientOnly } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { MarkdownLoadingFallback } from '@/components/markdown/loading-fallback'
import { isFileContentReady, useFilesStore } from '@/stores/files'
import { PREVIEW_WIDTH_MOBILE, usePreviewStore } from '@/stores/preview'
import MarkdownPreviewerSidebar from './sidebar'

const MarkdownRender = lazy(() => import('./render'))

const MOBILE_BREAKPOINT = 600

export default function MarkdownPreviewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useFilesStore(isFileContentReady)
  const previewWidth = usePreviewStore(state => state.previewWidth)
  const userPreferredWidth = usePreviewStore(state => state.userPreferredWidth)
  const setPreviewWidth = usePreviewStore(state => state.setPreviewWidth)

  useEffect(() => {
    const container = containerRef.current
    if (!container)
      return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const width = entry?.contentRect.width
      if (!width)
        return

      const targetWidth = width < MOBILE_BREAKPOINT
        ? PREVIEW_WIDTH_MOBILE
        : userPreferredWidth

      if (targetWidth !== previewWidth) {
        setPreviewWidth(targetWidth)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [setPreviewWidth, userPreferredWidth, previewWidth])

  return (
    <div className="flex size-full overflow-hidden bg-editor">
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center p-4"
      >
        {isReady
          ? (
              <ClientOnly fallback={<MarkdownLoadingFallback label="加载预览…" />}>
                <Suspense fallback={<MarkdownLoadingFallback label="加载预览…" />}>
                  <MarkdownRender />
                </Suspense>
              </ClientOnly>
            )
          : <MarkdownLoadingFallback label="加载预览…" />}
      </div>
      <MarkdownPreviewerSidebar />
    </div>
  )
}
