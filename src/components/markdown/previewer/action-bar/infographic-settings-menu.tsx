import type { InfographicPaletteId, InfographicThemeId } from '@/themes/infographic-theme'
import { Presentation } from 'lucide-react'
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
import { infographicPalettes, infographicThemes } from '@/themes/infographic-theme'

const infographicTooltip = '信息图设置'
const infographicAriaLabel = '信息图设置'

export function InfographicSettingsMenu() {
  const infographic = usePreviewStore(state => state.infographic)
  const setInfographic = usePreviewStore(state => state.setInfographic)

  const handleThemeChange = (theme: string) => {
    setInfographic({ theme: theme as InfographicThemeId })
  }

  const handlePaletteChange = (palette: string) => {
    setInfographic({ palette: palette as InfographicPaletteId })
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={(
            <DropdownMenuTrigger
              render={(
                <Button variant="ghost" size="icon" aria-label={infographicAriaLabel}>
                  <Presentation className="size-4" />
                </Button>
              )}
            />
          )}
        />
        <TooltipContent>{infographicTooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>信息图主题</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={infographic.theme} onValueChange={handleThemeChange}>
            {infographicThemes.map(theme => (
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

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>信息图配色</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={infographic.palette} onValueChange={handlePaletteChange}>
            {infographicPalettes.map(palette => (
              <DropdownMenuRadioItem
                key={palette.id}
                value={palette.id}
                className="cursor-pointer"
              >
                {palette.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
