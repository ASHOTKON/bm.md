import { afterEach, describe, expect, it, vi } from 'vitest'

const storageUnavailableReason = '浏览器存储不可用，内容仅保存在内存中，刷新页面会丢失'

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('idb')
  Reflect.deleteProperty(globalThis, 'window')
})

describe('file-storage', () => {
  it('indexedDB 写入失败时不吞掉错误，并保留内存回退内容', async () => {
    const rawErrorMessage = 'SHOULD_NOT_APPEAR_IN_RESPONSE'
    const openDB = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error(rawErrorMessage))

    vi.doMock('idb', () => ({ openDB }))
    Object.defineProperty(globalThis, 'window', { value: {}, configurable: true })

    const storage = await import('./file-storage')

    await expect(storage.saveFileContent('file-1', '临时内容')).rejects.toThrow(storageUnavailableReason)
    expect(storage.isStorageUnavailable()).toBe(true)
    expect(storage.getStorageUnavailableReason()).toBe(storageUnavailableReason)

    await expect(storage.saveFileContent('file-1', '新内容')).rejects.toThrow(storageUnavailableReason)
    await expect(storage.getFileContent('file-1')).resolves.toBe('新内容')
  })
})
