import type { IDBPDatabase } from 'idb'
import { openDB } from 'idb'

interface FileDB {
  files: {
    key: string
    value: { id: string, content: string }
  }
}

const DB_NAME = 'bm.md'
const DB_VERSION = 1
const STORAGE_UNAVAILABLE_REASON = '浏览器存储不可用，内容仅保存在内存中，刷新页面会丢失'

let db: Promise<IDBPDatabase<FileDB>> | null = null
let dbUnavailable = false
let dbUnavailableReason = ''

const memoryFallback = new Map<string, string>()

function markStorageUnavailable(): Error {
  dbUnavailable = true
  dbUnavailableReason = STORAGE_UNAVAILABLE_REASON
  db = null
  return new Error(dbUnavailableReason)
}

function getDB(): Promise<IDBPDatabase<FileDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB 仅在浏览器环境可用'))
  }

  if (dbUnavailable) {
    return Promise.reject(new Error(dbUnavailableReason))
  }

  if (!db) {
    db = openDB<FileDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('files', { keyPath: 'id' })
      },
    }).catch(() => {
      throw markStorageUnavailable()
    })
  }
  return db
}

export function isStorageUnavailable(): boolean {
  return dbUnavailable
}

export function getStorageUnavailableReason(): string {
  return dbUnavailableReason
}

export async function getFileContent(id: string): Promise<string> {
  if (dbUnavailable) {
    return memoryFallback.get(id) ?? ''
  }

  try {
    const database = await getDB()
    const record = await database.get('files', id)
    return record?.content ?? ''
  }
  catch {
    return memoryFallback.get(id) ?? ''
  }
}

export async function saveFileContent(id: string, content: string): Promise<void> {
  memoryFallback.set(id, content)

  if (dbUnavailable) {
    throw new Error(dbUnavailableReason)
  }

  try {
    const database = await getDB()
    await database.put('files', { id, content })
  }
  catch {
    throw markStorageUnavailable()
  }
}

export async function deleteFileContent(id: string): Promise<void> {
  memoryFallback.delete(id)

  if (dbUnavailable) {
    throw new Error(dbUnavailableReason)
  }

  try {
    const database = await getDB()
    await database.delete('files', id)
  }
  catch {
    throw markStorageUnavailable()
  }
}
