import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copyImage } from './export-image'

const mocks = vi.hoisted(() => ({
  copyImage: vi.fn(),
  error: vi.fn(),
  getPreviewElement: vi.fn(),
  success: vi.fn(),
  toBlob: vi.fn(),
}))

vi.mock('@/lib/clipboard', () => ({ copyImage: mocks.copyImage }))
vi.mock('./preview', () => ({ getPreviewElement: mocks.getPreviewElement }))
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: mocks.success } }))
vi.mock('@zumer/snapdom', () => ({
  snapdom: vi.fn(async () => ({ toBlob: mocks.toBlob })),
}))

describe('copyImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPreviewElement.mockReturnValue({})
    mocks.toBlob.mockResolvedValue(new Blob(['image'], { type: 'image/png' }))
  })

  it('剪贴板写入成功时提示成功', async () => {
    mocks.copyImage.mockResolvedValue(true)

    await copyImage()

    expect(mocks.success).toHaveBeenCalledWith('已复制图片到剪贴板')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('剪贴板写入返回 false 时只提示失败', async () => {
    mocks.copyImage.mockResolvedValue(false)

    await copyImage()

    expect(mocks.error).toHaveBeenCalledWith('复制图片失败')
    expect(mocks.success).not.toHaveBeenCalled()
  })
})
