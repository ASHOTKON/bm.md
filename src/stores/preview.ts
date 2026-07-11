import type { InfographicPaletteId, InfographicThemeId } from '@/themes/infographic-theme'
import type { MermaidThemeId } from '@/themes/mermaid-theme'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const PREVIEW_WIDTH_MOBILE = 415
export const PREVIEW_WIDTH_DESKTOP = 768

export type PreviewWidth = typeof PREVIEW_WIDTH_MOBILE | typeof PREVIEW_WIDTH_DESKTOP
export type PreviewColorScheme = 'light' | 'dark'

export interface InfographicSettings {
  theme: InfographicThemeId
  palette: InfographicPaletteId
}

interface PreviewState {
  hasHydrated: boolean
  setHasHydrated: (value: boolean) => void

  renderedSignature: string | null
  setRenderedSignature: (signature: string | null) => void

  previewWidth: PreviewWidth
  setPreviewWidth: (width: PreviewWidth) => void

  userPreferredWidth: PreviewWidth
  setUserPreferredWidth: (width: PreviewWidth) => void

  previewColorScheme: PreviewColorScheme
  togglePreviewColorScheme: () => void

  markdownStyle: string
  setMarkdownStyle: (id: string) => void

  codeTheme: string
  setCodeTheme: (theme: string) => void

  mermaidTheme: MermaidThemeId
  setMermaidTheme: (theme: MermaidThemeId) => void

  infographic: InfographicSettings
  setInfographic: (settings: Partial<InfographicSettings>) => void

  customCss: string
  setCustomCss: (css: string) => void
}

export function partializePreviewState(state: PreviewState) {
  return {
    userPreferredWidth: state.userPreferredWidth,
    previewColorScheme: state.previewColorScheme,
    markdownStyle: state.markdownStyle,
    codeTheme: state.codeTheme,
    mermaidTheme: state.mermaidTheme,
    infographic: state.infographic,
    customCss: state.customCss,
  }
}

export const usePreviewStore = create<PreviewState>()(
  persist(
    set => ({
      hasHydrated: false,
      setHasHydrated: hasHydrated => set({ hasHydrated }),

      renderedSignature: null,
      setRenderedSignature: renderedSignature => set({ renderedSignature }),

      previewWidth: PREVIEW_WIDTH_MOBILE,
      setPreviewWidth: previewWidth => set({ previewWidth }),

      userPreferredWidth: PREVIEW_WIDTH_MOBILE,
      setUserPreferredWidth: userPreferredWidth => set({ previewWidth: userPreferredWidth, userPreferredWidth }),

      previewColorScheme: 'light',
      togglePreviewColorScheme: () => set(state => ({
        previewColorScheme: state.previewColorScheme === 'dark' ? 'light' : 'dark',
      })),

      markdownStyle: 'ayu-light',
      setMarkdownStyle: markdownStyle => set({ markdownStyle }),

      codeTheme: 'kimbie-light',
      setCodeTheme: codeTheme => set({ codeTheme }),

      mermaidTheme: '',
      setMermaidTheme: mermaidTheme => set({ mermaidTheme }),

      infographic: { theme: 'default', palette: 'antv' },
      setInfographic: settings => set(state => ({
        infographic: { ...state.infographic, ...settings },
      })),

      customCss: '',
      setCustomCss: customCss => set({ customCss }),
    }),
    {
      name: 'bm.md.preview',
      skipHydration: true,
      partialize: partializePreviewState,
      onRehydrateStorage: state => (rehydratedState, error) => {
        if (error) {
          console.error('Zustand preview rehydration error:', error)
        }
        const nextState = rehydratedState ?? state
        nextState.setHasHydrated(true)
      },
    },
  ),
)
