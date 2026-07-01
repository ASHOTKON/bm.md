import { describe, expect, it } from 'vitest'

import { validateImageFile } from './api.upload.image'

describe('upload image validation', () => {
  it('拒绝非图片类型', () => {
    const file = new Blob(['hello'], { type: 'text/plain' })

    expect(validateImageFile(file)).toBe('只支持上传图片文件')
  })

  it('拒绝超过 5MB 的图片', () => {
    const file = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' })

    expect(validateImageFile(file)).toBe('图片大小不能超过 5MB')
  })

  it('接受合法图片类型和大小', () => {
    const file = new Blob(['image'], { type: 'image/png' })

    expect(validateImageFile(file)).toBeNull()
  })
})
