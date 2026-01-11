import { useFilesStore } from '@/stores/files'

const LAUNCH_HANDLED_KEY = 'bm.md.launch-handled'

export function initFileHandler() {
  if (!('launchQueue' in window))
    return

  window.launchQueue!.setConsumer(async (launchParams) => {
    if (!launchParams.files?.length)
      return

    // 使用 sessionStorage 防止刷新后重复处理
    const handledKey = launchParams.files
      .map(f => f.name)
      .sort()
      .join('|')
    const lastHandled = sessionStorage.getItem(LAUNCH_HANDLED_KEY)
    if (lastHandled === handledKey) {
      return
    }
    sessionStorage.setItem(LAUNCH_HANDLED_KEY, handledKey)

    const { createFile, switchFile } = useFilesStore.getState()
    let lastCreatedId: string | null = null

    for (const fileHandle of launchParams.files) {
      try {
        const file = await fileHandle.getFile()
        if (!file.name.match(/\.(md|markdown|mdown|mkd)$/i))
          continue

        const content = await file.text()
        const id = await createFile(file.name, content)
        lastCreatedId = id
      }
      catch (err) {
        console.error('[bm.md] 无法读取文件:', err)
      }
    }

    if (lastCreatedId) {
      await switchFile(lastCreatedId)
    }
  })
}
