import { afterEach, describe, expect, it, vi } from 'vitest'

import { Route, validateImageFile } from './api.upload.image'

const storageMock = vi.hoisted(() => {
  class MockStorageError extends Error {
    provider: string

    constructor(provider: string, message: string, options?: ErrorOptions) {
      super(message, options)
      this.name = 'StorageError'
      this.provider = provider
    }
  }

  return {
    getStorageProvider: vi.fn(),
    upload: vi.fn(),
    StorageError: MockStorageError,
  }
})

vi.mock('@/storage', () => ({
  getStorageProvider: storageMock.getStorageProvider,
  StorageError: storageMock.StorageError,
}))

interface UploadHandlerContext {
  request: Request
}

type UploadPostHandler = (context: UploadHandlerContext) => Promise<Response>

function getPostHandler(): UploadPostHandler {
  const route = Route as unknown as {
    options: {
      server: {
        handlers: {
          POST: UploadPostHandler
        }
      }
    }
  }

  return route.options.server.handlers.POST
}

function createUploadRequest(formData: FormData) {
  return new Request('http://localhost/api/upload/image', {
    method: 'POST',
    body: formData,
  })
}

function createImageFile() {
  return new File(['image'], 'image.png', { type: 'image/png' })
}

afterEach(() => {
  vi.restoreAllMocks()
  storageMock.getStorageProvider.mockReset()
  storageMock.upload.mockReset()
})

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

describe('upload image route', () => {
  it('成功上传图片并返回 URL', async () => {
    const imageFile = createImageFile()
    const formData = new FormData()
    formData.set('file', imageFile)
    formData.set('name', 'image.png')
    storageMock.upload.mockResolvedValue({ url: 'https://cdn.example.com/image.png' })
    storageMock.getStorageProvider.mockReturnValue({ upload: storageMock.upload })

    const response = await getPostHandler()({ request: createUploadRequest(formData) })
    const data = await response.json() as { url?: string }

    expect(response.status).toBe(200)
    expect(data).toEqual({ url: 'https://cdn.example.com/image.png' })
    expect(storageMock.getStorageProvider).toHaveBeenCalledOnce()
    expect(storageMock.upload).toHaveBeenCalledWith({
      file: imageFile,
      filename: 'image.png',
      contentType: 'image/png',
    })
  })

  it.each([
    ['缺少文件', 'name'],
    ['缺少文件名', 'file'],
  ])('%s 时返回请求参数错误', async (_label, onlyField) => {
    const formData = new FormData()
    if (onlyField === 'file') {
      formData.set('file', createImageFile())
    }
    else {
      formData.set('name', 'image.png')
    }

    const response = await getPostHandler()({ request: createUploadRequest(formData) })
    const data = await response.json() as { error?: string }

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: '请求参数错误' })
    expect(storageMock.getStorageProvider).not.toHaveBeenCalled()
  })

  it('存储错误返回通用失败信息且不泄露细节', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const formData = new FormData()
    formData.set('file', createImageFile())
    formData.set('name', 'image.png')
    storageMock.upload.mockRejectedValue(new storageMock.StorageError('test', 'private detail'))
    storageMock.getStorageProvider.mockReturnValue({ upload: storageMock.upload })

    const response = await getPostHandler()({ request: createUploadRequest(formData) })
    const data = await response.json() as { error?: string }

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: '图片上传到存储失败' })
    expect(JSON.stringify(data)).not.toContain('private detail')
    expect(consoleError).toHaveBeenCalledOnce()
  })

  it('未知异常返回通用失败信息且不泄露细节', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const formData = new FormData()
    formData.set('file', createImageFile())
    formData.set('name', 'image.png')
    storageMock.upload.mockRejectedValue(new Error('private detail'))
    storageMock.getStorageProvider.mockReturnValue({ upload: storageMock.upload })

    const response = await getPostHandler()({ request: createUploadRequest(formData) })
    const data = await response.json() as { error?: string }

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: '图片上传失败，请稍后重试' })
    expect(JSON.stringify(data)).not.toContain('private detail')
    expect(consoleError).toHaveBeenCalledOnce()
  })
})
