import { renderToString } from '@antv/infographic/ssr'
import { isValidPalette, isValidTheme } from '@/themes/infographic-theme'
import { createSvgRendererPlugin } from './rehype-svg-renderer'
import { makeSvgResponsive } from './svg-style'

export interface RehypeInfographicOptions {
  theme?: string
  palette?: string
}

function extractSvgContent(svgString: string): string {
  const svgMatch = svgString.match(/<svg[\s\S]*<\/svg>/i)
  if (!svgMatch) {
    throw new Error('未找到 SVG 输出')
  }

  return svgMatch[0]
}

/**
 * 构建完整的 infographic 语法
 * 如果用户代码没有指定主题/色板，则注入全局配置
 */
function buildSyntax(code: string, options: RehypeInfographicOptions): string {
  const { theme, palette } = options
  const lines = code.split('\n')
  const hasThemeBlock = lines.some(line => /^\s*theme\b/.test(line))

  if (!hasThemeBlock) {
    const validTheme = theme && isValidTheme(theme) ? theme : 'default'
    const validPalette = palette && isValidPalette(palette) ? palette : undefined

    const themeConfig: string[] = [`theme ${validTheme}`]
    if (validPalette) {
      themeConfig.push(`  palette ${validPalette}`)
    }
    return `${code}\n${themeConfig.join('\n')}`
  }

  return code
}

const rehypeInfographic = createSvgRendererPlugin<RehypeInfographicOptions>({
  languageId: 'infographic',
  figureClassName: 'figure-infographic',
  render: async (code, options) => {
    const syntax = buildSyntax(code, options)
    return renderToString(syntax)
  },
  extractSvg: extractSvgContent,
  adjustSvgStyle: svgNode => makeSvgResponsive(svgNode, { visible: true }),
})

export default rehypeInfographic
