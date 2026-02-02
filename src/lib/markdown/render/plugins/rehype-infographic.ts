import type { Element } from 'hast'
import { renderToString } from '@antv/infographic/ssr'
import { isValidPalette, isValidTheme } from '@/themes/infographic-theme'
import { createSvgRendererPlugin } from './rehype-svg-renderer'

export interface RehypeInfographicOptions {
  theme?: string
  palette?: string
}

/**
 * 从 SSR 渲染结果中提取纯 SVG 内容
 * renderToString 返回的格式包含 XML 声明和样式表引用，需要移除
 */
function extractSvgContent(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') {
    throw new Error('Invalid SVG string: empty or non-string input')
  }

  const svgMatch = svgString.match(/<svg[\s\S]*<\/svg>/i)
  if (!svgMatch) {
    throw new Error('Invalid SVG string: no <svg> element found')
  }

  return svgMatch[0]
}

/**
 * 调整 SVG 节点的样式：追加尺寸控制样式，保留已有样式
 */
function adjustSvgStyle(svgNode: Element): void {
  const props = svgNode.properties || {}
  const existingStyle = typeof props.style === 'string' ? props.style : ''

  delete props.width
  delete props.height

  const additionalStyle = 'max-width:100%;height:auto;visibility:visible;'
  props.style = existingStyle
    ? `${existingStyle};${additionalStyle}`
    : additionalStyle

  svgNode.properties = props
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
  adjustSvgStyle,
})

export default rehypeInfographic
