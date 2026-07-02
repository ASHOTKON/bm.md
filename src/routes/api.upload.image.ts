import { createFileRoute } from '@tanstack/react-router'
import * as z from 'zod'
import { corsMiddleware } from '@/lib/middleware/cors'
import { getStorageProvider, StorageError } from '@/storage'

const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

const uploadSchema = z.object({
  name: z.string().min(1),
  file: z.instanceof(Blob),
})

export function validateImageFile(imageFile: Blob): string | null {
  if (!imageFile.type.startsWith('image/')) {
    return '只支持上传图片文件'
  }

  if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
    return `图片大小不能超过 ${MAX_IMAGE_SIZE_MB}MB`
  }

  return null
}

export const Route = createFileRoute('/api/upload/image')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData()
          const file = formData.get('file')
          const name = formData.get('name')

          const parsed = uploadSchema.parse({ file, name })
          const { file: imageFile, name: imageName } = parsed

          const validationError = validateImageFile(imageFile)
          if (validationError) {
            return Response.json(
              { error: validationError },
              { status: 400 },
            )
          }

          const storage = getStorageProvider()
          const result = await storage.upload({
            file: imageFile,
            filename: imageName,
            contentType: imageFile.type,
          })

          return Response.json({ url: result.url })
        }
        catch (error) {
          if (error instanceof z.ZodError) {
            return Response.json(
              { error: '请求参数错误' },
              { status: 400 },
            )
          }

          if (error instanceof StorageError) {
            console.error(`Upload error [${error.provider}]:`, error.message, error.cause)
            return Response.json(
              { error: '图片上传到存储失败' },
              { status: 500 },
            )
          }

          console.error('Upload error:', error)

          return Response.json(
            { error: '图片上传失败，请稍后重试' },
            { status: 500 },
          )
        }
      },
    },
  },
})
