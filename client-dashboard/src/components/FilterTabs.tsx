'use client'

interface FilterTabsProps {
    currentFilter: 'pending' | 'in_progress' | 'completed' | 'all'
    onFilterChange: (filter: 'pending' | 'in_progress' | 'completed' | 'all') => void
    counts: {
        all: number
        pending: number
        in_progress: number
        completed: number
    }
}

export default function FilterTabs({ currentFilter, onFilterChange, counts }: FilterTabsProps) {
    const tabs = [
        { id: 'all', label: 'All Tasks' },
        { id: 'pending', label: 'Pending' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
    ] as const

    return (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onFilterChange(tab.id)}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                            ${currentFilter === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        {tab.label}
                        <span className={`
                            py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors
                            ${currentFilter === tab.id
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                            }
                        `}>
                            {counts[tab.id]}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    )
}
