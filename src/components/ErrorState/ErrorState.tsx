interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps): JSX.Element {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl" role="img" aria-label="Error">
        📡
      </div>
      <p className="text-base text-gray-600 dark:text-gray-400">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white active:bg-blue-700"
      >
        Tap to retry
      </button>
    </div>
  )
}
