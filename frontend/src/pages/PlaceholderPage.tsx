interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="rounded-xl border border-dashed border-border bg-card px-10 py-14 text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">This section hasn't been built yet.</p>
      </div>
    </div>
  )
}
