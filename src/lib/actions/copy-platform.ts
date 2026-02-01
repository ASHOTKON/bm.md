import type { SupportedPlatform } from '@/config'
import { toast } from 'sonner'
import { platformConfig } from '@/config'
import { trackEvent } from '@/lib/analytics'
import { copyHtml } from '@/lib/clipboard'

const developingPlatforms: SupportedPlatform[] = ['zhihu', 'juejin']

interface CopyPlatformOptions {
  platform: SupportedPlatform
  markdownStyle: string
  codeTheme: string
  source: 'button' | 'menu'
  getHtml: () => Promise<string>
}

export async function copyPlatform({
  platform,
  markdownStyle,
  codeTheme,
  source,
  getHtml,
}: CopyPlatformOptions) {
  if (developingPlatforms.includes(platform)) {
    toast.info('功能开发中，敬请期待')
    return
  }

  const config = platformConfig[platform]
  try {
    const html = await getHtml()
    if (!html.trim()) {
      toast.error('没有可复制的内容')
      return
    }
    const success = await copyHtml(html)
    if (success) {
      toast.success(config.successMessage)
      trackEvent('copy', platform, source, { markdownStyle, codeTheme })
    }
    else {
      toast.error('复制失败')
    }
  }
  catch {
    toast.error('渲染失败')
  }
}
