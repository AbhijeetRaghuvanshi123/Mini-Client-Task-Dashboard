interface StatusBadgeProps {
    status: 'pending' | 'in_progress' | 'completed'
    isOverdue?: boolean
}

export default function StatusBadge({ status, isOverdue }: StatusBadgeProps) {
    if (status !== 'completed' && isOverdue) {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                Overdue
            </span>
        )
    }

    const styles = {
        pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
        completed: 'bg-green-50 text-green-700 border-green-200'
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${styles[status]}`}>
            {status.replace('_', ' ')}
        </span>
    )
}
