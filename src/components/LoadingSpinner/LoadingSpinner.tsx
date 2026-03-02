interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingSpinner({
  message = 'Loading news…',
  fullScreen = false,
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-8 ${
        fullScreen ? 'min-h-[60vh]' : ''
      }`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
