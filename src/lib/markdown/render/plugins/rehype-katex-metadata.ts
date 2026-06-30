import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { createRichMetadata, richData } from './rich-metadata'

function getClassList(node: Element): string[] {
  const className = node.properties?.className
  if (Array.isArray(className)) {
    return className.filter((item): item is string => typeof item === 'string')
  }
  if (typeof className === 'string') {
    return className.split(/\s+/).filter(Boolean)
  }
  return []
}

function textContent(node: Element): string {
  const texts: string[] = []
  const walk = (element: Element) => {
    for (const child of element.children) {
      if (child.type === 'text') {
        texts.push(child.value)
      }
      else if (child.type === 'element') {
        walk(child)
      }
    }
  }
  walk(node)
  return texts.join('')
}

function isDisplayKatex(node: Element): boolean {
  return getClassList(node).includes('katex-display')
}

function isInlineKatex(node: Element, parent?: Element): boolean {
  if (!getClassList(node).includes('katex')) {
    return false
  }

  return !parent || !isDisplayKatex(parent)
}

const rehypeKatexMetadata: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node: Element, _index, parent) => {
      const parentElement = parent?.type === 'element' ? parent as Element : undefined
      if (!isDisplayKatex(node) && !isInlineKatex(node, parentElement)) {
        return
      }

      node.properties = {
        ...node.properties,
        ...richData(createRichMetadata('katex', textContent(node))),
      }
    })
  }
}

export default rehypeKatexMetadata
