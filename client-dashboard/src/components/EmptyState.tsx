interface EmptyStateProps {
    onAction?: () => void
}

export default function EmptyState({ onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No tasks found</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
                Get started by creating your first task to track progress.
            </p>
            {onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                    + Create Task
                </button>
            )}
        </div>
    )
}
