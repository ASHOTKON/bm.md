import { toast } from 'sonner'
import { useFilesStore } from '@/stores/files'

export interface ImportedFile {
  name: string
  content: string
}

export async function parseFileToMarkdown(file: File): Promise<ImportedFile | null> {
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
    const content = await file.text()
    const name = file.name.endsWith('.md') ? file.name : `${file.name}.md`
    return { name, content }
  }

  if (file.type === 'text/html') {
    const html = await file.text()
    const { markdown } = await import('@/lib/markdown/browser')
    const { result: content } = await markdown.parse({ html })
    const baseName = file.name.replace(/\.html?$/i, '')
    return { name: `${baseName}.md`, content }
  }

  return null
}

export async function importFilesAsNewTabs(files: File[]): Promise<string | null> {
  const { createFile, switchFile } = useFilesStore.getState()
  let lastCreatedId: string | null = null

  for (const file of files) {
    try {
      const parsed = await parseFileToMarkdown(file)
      if (parsed) {
        const id = await createFile(parsed.name, parsed.content)
        lastCreatedId = id
        toast.success(`导入成功: ${parsed.name}`)
      }
    }
    catch (error) {
      console.error('Import error:', error)
      toast.error(`导入失败: ${file.name}`)
    }
  }

  if (lastCreatedId) {
    await switchFile(lastCreatedId)
  }

  return lastCreatedId
}

export function isTextFile(file: File): boolean {
  return (
    file.type === 'text/markdown'
    || file.name.endsWith('.md')
    || file.type === 'text/html'
  )
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
