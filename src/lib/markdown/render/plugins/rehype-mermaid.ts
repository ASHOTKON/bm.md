import type { ThemeName } from 'beautiful-mermaid'
import type { Element, Root } from 'hast'
import type { Plugin, Transformer } from 'unified'
import { renderMermaid, THEMES } from 'beautiful-mermaid'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

export interface RehypeMermaidOptions {
  theme?: string
}

// SVG 解析器，将 SVG 字符串转换为 HAST 节点
const svgParser = unified().use(rehypeParse, { fragment: true })

function isMermaidCodeBlock(node: Element): boolean {
  if (node.tagName !== 'pre')
    return false
  const code = node.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'code',
  )
  if (!code)
    return false
  const className = Array.isArray(code.properties?.className)
    ? code.properties.className
    : []
  return className.some(c => typeof c === 'string' && c.includes('mermaid'))
}

function extractText(pre: Element): string {
  const code = pre.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'code',
  )
  if (!code)
    return ''
  return code.children
    .filter((c): c is { type: 'text', value: string } => c.type === 'text')
    .map(c => c.value)
    .join('')
}

function isValidTheme(theme: string): theme is ThemeName {
  return theme !== '' && theme in THEMES
}

/**
 * 调整 SVG 节点的样式：设置 min-width: 100%，移除固定宽度
 */
function adjustSvgStyle(svgNode: Element): void {
  const props = svgNode.properties || {}

  // 获取现有的 style 属性
  const existingStyle = typeof props.style === 'string' ? props.style : ''

  // 移除 width 属性，保留 height 用于保持宽高比
  delete props.width

  props.style = existingStyle
    ? `${existingStyle};min-width:100%;max-width:unset;`
    : 'min-width:100%'

  svgNode.properties = props
}

const rehypeMermaid: Plugin<[RehypeMermaidOptions?], Root> = (options = {}) => {
  const transformer: Transformer<Root> = async (tree) => {
    const tasks: { parent: Element, index: number, code: string }[] = []

    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number')
        return
      if (!isMermaidCodeBlock(node as Element))
        return

      const code = extractText(node as Element)
      if (!code.trim())
        return

      tasks.push({ parent: parent as Element, index, code })
      return SKIP
    })

    if (tasks.length === 0) {
      return
    }

    // 验证主题是否有效
    const themeColors = options.theme && isValidTheme(options.theme)
      ? THEMES[options.theme]
      : undefined

    await Promise.all(
      tasks.map(async ({ parent, index, code }) => {
        try {
          const svg = await renderMermaid(code, themeColors)

          // 将 SVG 字符串解析为 HAST 节点，而不是使用 raw
          // 这样 SVG 会被 rehypeSanitize 正常处理
          const parsed = svgParser.parse(svg)
          const svgNode = parsed.children[0] as Element | undefined

          if (!svgNode || svgNode.type !== 'element') {
            throw new Error('Failed to parse SVG')
          }

          // 调整 SVG 样式：min-width: 100%，移除固定宽度
          adjustSvgStyle(svgNode)

          const figure: Element = {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['figure-mermaid'] },
            children: [svgNode],
          }
          parent.children.splice(index, 1, figure)
        }
        catch (error) {
          // 渲染失败时显示错误提示，而不是静默保留原代码块
          console.error('Mermaid render error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Render failed'
          const errorFigure: Element = {
            type: 'element',
            tagName: 'figure',
            properties: {
              'className': ['figure-mermaid', 'figure-mermaid-error'],
              'data-error': errorMessage,
            },
            children: [
              {
                type: 'element',
                tagName: 'pre',
                properties: { className: ['mermaid-error'] },
                children: [
                  {
                    type: 'element',
                    tagName: 'code',
                    properties: {},
                    children: [{ type: 'text', value: code }],
                  },
                ],
              },
            ],
          }
          parent.children.splice(index, 1, errorFigure)
        }
      }),
    )
  }

  return transformer
}

export default rehypeMermaid
