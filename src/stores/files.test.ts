import type { MarkdownFile } from './files'

import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteFileContent, getFileContent, saveFileContent } from '@/lib/file-storage'

import { useFilesStore } from './files'

vi.mock('@/lib/file-storage', () => ({
  deleteFileContent: vi.fn(),
  getFileContent: vi.fn(),
  saveFileContent: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

const initialFile: MarkdownFile = {
  id: 'file-1',
  name: 'bm.md',
  createdAt: 1,
  updatedAt: 1,
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(deleteFileContent).mockReset()
  vi.mocked(getFileContent).mockReset()
  vi.mocked(saveFileContent).mockReset()
  vi.mocked(toast.error).mockReset()
  vi.mocked(toast.warning).mockReset()
  useFilesStore.setState({
    files: [initialFile],
    activeFileId: initialFile.id,
    currentContent: '',
    isInitialized: true,
    hasHydrated: true,
    lastSaveError: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('files store', () => {
  it('setCurrentContent 在持久化保存失败后记录错误并显示 Toast', async () => {
    vi.mocked(saveFileContent).mockRejectedValue(new Error('浏览器存储不可用'))

    useFilesStore.getState().setCurrentContent('新内容')
    await vi.advanceTimersByTimeAsync(500)

    expect(saveFileContent).toHaveBeenCalledWith(initialFile.id, '新内容')
    expect(useFilesStore.getState().lastSaveError).toBe('浏览器存储不可用')
    expect(toast.error).toHaveBeenCalledWith('保存失败: 浏览器存储不可用')
  })

  it('createFile 会规范化文件名并避免重名', async () => {
    vi.mocked(saveFileContent).mockResolvedValue()
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000002')
    useFilesStore.setState({ files: [{ ...initialFile, name: '笔记.md' }] })

    const id = await useFilesStore.getState().createFile('笔记', '内容')

    expect(id).toBe('00000000-0000-4000-8000-000000000002')
    expect(useFilesStore.getState().files.map(file => file.name)).toEqual(['笔记.md', '笔记 (1).md'])
    expect(saveFileContent).toHaveBeenCalledWith(id, '内容')
    randomUUID.mockRestore()
  })

  it('createFile 在保存失败时仍创建文件元数据并返回 id', async () => {
    vi.mocked(saveFileContent).mockRejectedValue(new Error('浏览器存储不可用'))
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000003')

    const id = await useFilesStore.getState().createFile('离线文件', '离线内容')

    expect(id).toBe('00000000-0000-4000-8000-000000000003')
    expect(useFilesStore.getState().files).toContainEqual(expect.objectContaining({
      id,
      name: '离线文件.md',
    }))
    expect(useFilesStore.getState().activeFileId).toBe(id)
    expect(useFilesStore.getState().currentContent).toBe('离线内容')
    expect(useFilesStore.getState().lastSaveError).toBe('浏览器存储不可用')
    expect(toast.error).toHaveBeenCalledWith('创建文件保存失败: 浏览器存储不可用')
    randomUUID.mockRestore()
  })

  it('deleteFile 删除最后一个文件且默认文件保存失败时仍切换到有效文件', async () => {
    vi.mocked(deleteFileContent).mockResolvedValue()
    vi.mocked(saveFileContent).mockRejectedValue(new Error('浏览器存储不可用'))
    vi.mocked(getFileContent).mockResolvedValue('默认内容')
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000004')

    await useFilesStore.getState().deleteFile(initialFile.id)

    const state = useFilesStore.getState()
    expect(state.files).toHaveLength(1)
    expect(state.files[0].id).toBe('00000000-0000-4000-8000-000000000004')
    expect(state.activeFileId).toBe(state.files[0].id)
    expect(state.getActiveFile()?.id).toBe(state.activeFileId)
    expect(state.lastSaveError).toBe('浏览器存储不可用')
    expect(toast.error).toHaveBeenCalledWith('创建文件保存失败: 浏览器存储不可用')
    randomUUID.mockRestore()
  })

  it('switchFile 会忽略过期的加载结果', async () => {
    vi.useRealTimers()
    let resolveOld: (content: string) => void = () => {}
    const oldLoad = new Promise<string>((resolve) => {
      resolveOld = resolve
    })
    vi.mocked(getFileContent).mockImplementation(async (id) => {
      if (id === 'old-file') {
        return oldLoad
      }
      return '新内容'
    })
    useFilesStore.setState({
      files: [
        { ...initialFile, id: 'old-file', name: '旧.md' },
        { ...initialFile, id: 'new-file', name: '新.md' },
      ],
      activeFileId: null,
      currentContent: '',
    })

    const firstSwitch = useFilesStore.getState().switchFile('old-file')
    await useFilesStore.getState().switchFile('new-file')
    resolveOld('旧内容')
    await firstSwitch

    expect(useFilesStore.getState().activeFileId).toBe('new-file')
    expect(useFilesStore.getState().currentContent).toBe('新内容')
  })
})
