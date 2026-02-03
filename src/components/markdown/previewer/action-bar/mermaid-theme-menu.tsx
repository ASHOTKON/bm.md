import { Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePreviewStore } from '@/stores/preview'
import { mermaidThemes } from '@/themes/mermaid-theme'

const mermaidThemeTooltip = '流程图主题'
const mermaidThemeAriaLabel = '流程图主题'

export function MermaidThemeMenu() {
  const currentTheme = usePreviewStore(state => state.mermaidTheme)
  const setMermaidTheme = usePreviewStore(state => state.setMermaidTheme)

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={(
            <DropdownMenuTrigger
              render={(
                <Button variant="ghost" size="icon" aria-label={mermaidThemeAriaLabel}>
                  <Workflow className="size-4" />
                </Button>
              )}
            />
          )}
        />
        <TooltipContent>{mermaidThemeTooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>流程图主题</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={currentTheme} onValueChange={setMermaidTheme}>
            {mermaidThemes.map(theme => (
              <DropdownMenuRadioItem
                key={theme.id}
                value={theme.id}
                className="cursor-pointer"
              >
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
