interface MarkdownLoadingFallbackProps {
  label: string
}

export function MarkdownLoadingFallback({ label }: MarkdownLoadingFallbackProps) {
  return (
    <div
      role="status"
      className={`
        flex size-full items-center justify-center bg-editor p-3 text-xs
        text-muted-foreground select-none
      `}
    >
      {label}
    </div>
  )
}
