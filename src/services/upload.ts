import { apiFetch } from '@/lib/api'

export interface UploadImageResponse {
  url: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getUploadErrorMessage(error: unknown) {
  if (isRecord(error) && isRecord(error.data) && typeof error.data.error === 'string') {
    return error.data.error
  }

  return error instanceof Error && error.message
    ? error.message
    : '图片上传失败'
}

export async function uploadImage(formData: FormData): Promise<UploadImageResponse> {
  try {
    return await apiFetch<UploadImageResponse>('/api/upload/image', {
      method: 'POST',
      body: formData,
    })
  }
  catch (error) {
    throw new Error(getUploadErrorMessage(error))
  }
}
