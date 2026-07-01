import { debounce } from 'es-toolkit'
import morphdom from 'morphdom'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePreviewScrollSync } from '@/components/markdown/hooks/use-scroll-sync'
import { Phone } from '@/components/mockups/iphone'
import { Safari } from '@/components/mockups/safari'
import { getMarkdownLocaleTexts } from '@/lib/locale'
import { useEditorStore } from '@/stores/editor'
import { useFilesStore } from '@/stores/files'
import { PREVIEW_WIDTH_MOBILE, usePreviewStore } from '@/stores/preview'
import { applyDarkModeToPreviewHtml } from './darkmode'
import iframeShell from './iframe-shell.html?raw'

const RENDER_DEBOUNCE_MS = 100
const PREVIEW_STYLE_ID = 'bm-preview-style'

export default function MarkdownRender() {
  const content = useFilesStore(state => state.currentContent)
  const enableScrollSync = useEditorStore(state => state.enableScrollSync)
  const enableFootnoteLinks = useEditorStore(state => state.enableFootnoteLinks)
  const openLinksInNewWindow = useEditorStore(state => state.openLinksInNewWindow)
  const hasHydrated = usePreviewStore(state => state.hasHydrated)
  const previewWidth = usePreviewStore(state => state.previewWidth)
  const markdownStyle = usePreviewStore(state => state.markdownStyle)
  const codeTheme = usePreviewStore(state => state.codeTheme)
  const mermaidTheme = usePreviewStore(state => state.mermaidTheme)
  const infographic = usePreviewStore(state => state.infographic)
  const customCss = usePreviewStore(state => state.customCss)
  const previewColorScheme = usePreviewStore(state => state.previewColorScheme)
  const renderedHtml = usePreviewStore(state => state.getRenderedHtml('html'))
  const setRenderedHtml = usePreviewStore(state => state.setRenderedHtml)
  const clearRenderedHtmlCache = usePreviewStore(state => state.clearRenderedHtmlCache)

  const { iframeRef, onIframeLoad: onScrollSyncLoad } = usePreviewScrollSync({
    enabled: enableScrollSync,
  })

  const iframeReadyRef = useRef(false)
  const pendingHtmlRef = useRef<string | null>(null)
  const pendingCssRef = useRef<string | null>(null)
  const canceledRef = useRef(false)
  const renderedHtmlRef = useRef(renderedHtml)
  const previewCssRef = useRef('')

  useEffect(() => {
    renderedHtmlRef.current = renderedHtml
  }, [renderedHtml])

  const updateIframeStyle = useCallback((css: string) => {
    const iframeDoc = iframeRef.current?.contentDocument
    const head = iframeDoc?.head

    if (!head) {
      pendingCssRef.current = css
      return
    }

    let style = head.querySelector<HTMLStyleElement>(`#${PREVIEW_STYLE_ID}`)
    if (!style) {
      style = iframeDoc.createElement('style')
      style.id = PREVIEW_STYLE_ID
      head.append(style)
    }

    style.textContent = css
    pendingCssRef.current = null
  }, [iframeRef])

  const updateIframeContent = useCallback((html: string) => {
    const iframe = iframeRef.current
    const body = iframe?.contentDocument?.body

    if (!body) {
      pendingHtmlRef.current = html
      pendingCssRef.current = previewCssRef.current
      return
    }

    updateIframeStyle(previewCssRef.current)

    const wrapper = document.createElement('body')
    wrapper.innerHTML = previewColorScheme === 'dark'
      ? applyDarkModeToPreviewHtml(html)
      : html

    body.style.backgroundColor = previewColorScheme === 'dark' ? '#111111' : ''
    body.style.colorScheme = previewColorScheme

    morphdom(body, wrapper, {
      childrenOnly: true,
      onBeforeElUpdated(fromEl, toEl) {
        if (fromEl.isEqualNode(toEl)) {
          return false
        }
        return true
      },
    })
  }, [iframeRef, previewColorScheme, updateIframeStyle])

  const onIframeLoad = useCallback(() => {
    iframeReadyRef.current = true
    onScrollSyncLoad()

    const htmlToRender = pendingHtmlRef.current ?? renderedHtmlRef.current
    updateIframeStyle(pendingCssRef.current ?? previewCssRef.current)
    if (htmlToRender) {
      updateIframeContent(htmlToRender)
      pendingHtmlRef.current = null
    }

    // 拦截 iframe 内的链接点击
    const iframeDoc = iframeRef.current?.contentDocument
    if (iframeDoc) {
      iframeDoc.addEventListener('click', (e: MouseEvent) => {
        const link = (e.target as HTMLElement).closest('a')
        if (!link)
          return

        const href = link.getAttribute('href')
        if (!href)
          return

        e.preventDefault()

        // 页内锚点跳转（脚注引用、返回链接等）
        if (href.startsWith('#')) {
          let targetHref = href
          if (href.includes('-fnref-')) {
            targetHref = href.replace('-fnref-', '-fn-')
          }
          else if (href.includes('-fn-')) {
            targetHref = href.replace('-fn-', '-fnref-')
          }
          const target = iframeDoc.querySelector(`[href="${CSS.escape(targetHref)}"]`)
          if (target) {
            target.scrollIntoView({ behavior: 'auto' })
          }
          return
        }

        // 外部链接 - 顶层窗口新开标签页
        window.open(href, '_blank', 'noopener')
      })
    }
  }, [onScrollSyncLoad, updateIframeContent, updateIframeStyle, iframeRef])

  useEffect(() => {
    if (!renderedHtml) {
      return
    }

    if (iframeReadyRef.current) {
      updateIframeContent(renderedHtml)
    }
    else {
      pendingHtmlRef.current = renderedHtml
    }
  }, [renderedHtml, updateIframeContent])

  const scheduleRender = useMemo(
    () => debounce(async (
      nextContent: string,
      styleId: string,
      themeId: string,
      mermaidThemeId: string,
      infographicThemeId: string,
      infographicPaletteId: string,
      customCssValue: string,
      enableRefLinks: boolean,
      openNewWin: boolean,
      colorScheme: string,
    ) => {
      try {
        const { markdown } = await import('@/lib/markdown/browser')
        const renderInput = {
          markdown: nextContent,
          markdownStyle: styleId,
          codeTheme: themeId,
          mermaidTheme: mermaidThemeId,
          infographicTheme: infographicThemeId,
          infographicPalette: infographicPaletteId,
          customCss: customCssValue,
          enableFootnoteLinks: enableRefLinks,
          openLinksInNewWindow: openNewWin,
          ...getMarkdownLocaleTexts(),
        }

        const result = colorScheme === 'dark'
          ? await markdown.render(renderInput)
          : await markdown.preview(renderInput)

        if (!canceledRef.current) {
          if ('result' in result) {
            previewCssRef.current = ''
            updateIframeStyle('')
            setRenderedHtml('html', result.result)
          }
          else {
            previewCssRef.current = result.css
            updateIframeStyle(result.css)
            setRenderedHtml('html', `<section id="bm-md">${result.html}</section>`)
          }
        }
      }
      catch (error) {
        if (!canceledRef.current) {
          const message = error instanceof Error ? error.message : '转换失败'
          setRenderedHtml('html', message)
        }
      }
    }, RENDER_DEBOUNCE_MS),
    [setRenderedHtml, updateIframeStyle],
  )

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    clearRenderedHtmlCache()
    canceledRef.current = false
    scheduleRender(content, markdownStyle, codeTheme, mermaidTheme, infographic.theme, infographic.palette, customCss, enableFootnoteLinks, openLinksInNewWindow, previewColorScheme)

    return () => {
      canceledRef.current = true
      scheduleRender.cancel()
    }
  }, [hasHydrated, content, markdownStyle, codeTheme, mermaidTheme, infographic, customCss, enableFootnoteLinks, openLinksInNewWindow, previewColorScheme, scheduleRender, clearRenderedHtmlCache])

  const isMobile = previewWidth === PREVIEW_WIDTH_MOBILE

  const iframeContent = (
    <iframe
      ref={iframeRef}
      id="bm-preview-iframe"
      title="Markdown 预览"
      className="size-full border-0"
      sandbox="allow-same-origin allow-modals"
      srcDoc={iframeShell}
      onLoad={onIframeLoad}
    />
  )

  if (isMobile) {
    return (
      <Phone>
        {iframeContent}
      </Phone>
    )
  }

  return (
    <Safari
      className="size-full"
      style={{ maxWidth: previewWidth }}
      url="bm.md"
      mode="simple"
    >
      {iframeContent}
    </Safari>
  )
}
