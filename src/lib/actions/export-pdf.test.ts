import { describe, expect, it } from 'vitest'
import { findSafePageBreaks } from './export-pdf'

interface MockRect {
  top: number
  bottom: number
  width: number
}

interface MockElement {
  rect: MockRect
  selector: 'block' | 'heading'
}

function createContent(rect: MockRect, elements: MockElement[] = []): HTMLElement {
  return {
    getBoundingClientRect: () => rect,
    querySelectorAll: (selectors: string) => elements
      .filter((element) => {
        if (selectors.startsWith('h')) {
          return element.selector === 'heading'
        }
        return element.selector === 'block'
      })
      .map(element => ({
        getBoundingClientRect: () => element.rect,
      })),
  } as unknown as HTMLElement
}

describe('findSafePageBreaks', () => {
  it('returns no breaks for empty or single-page content', () => {
    const content = createContent({ top: 0, bottom: 800, width: 1000 })

    expect(findSafePageBreaks(content, 1000, 800, 1000)).toEqual([])
  })

  it('returns increasing breaks for multi-page content', () => {
    const content = createContent({ top: 0, bottom: 2500, width: 1000 })
    const breaks = findSafePageBreaks(content, 1000, 2500, 1000)

    expect(breaks).toEqual([1000, 2000])
    expect(breaks[1]).toBeGreaterThan(breaks[0])
  })

  it('moves a break to the top of a block crossing the ideal break', () => {
    const content = createContent(
      { top: 0, bottom: 500, width: 1000 },
      [{ selector: 'block', rect: { top: 150, bottom: 260, width: 1000 } }],
    )

    expect(findSafePageBreaks(content, 1000, 500, 200)[0]).toBe(150)
  })

  it('does not move breaks backwards or too close to the previous break', () => {
    const content = createContent(
      { top: 0, bottom: 700, width: 1000 },
      [
        { selector: 'block', rect: { top: 90, bottom: 230, width: 1000 } },
        { selector: 'block', rect: { top: 280, bottom: 430, width: 1000 } },
      ],
    )
    const breaks = findSafePageBreaks(content, 1000, 700, 200)

    for (let i = 1; i < breaks.length; i++) {
      expect(breaks[i]).toBeGreaterThan(breaks[i - 1])
      expect(breaks[i]).toBeGreaterThan(breaks[i - 1] + 100)
    }
  })
})
