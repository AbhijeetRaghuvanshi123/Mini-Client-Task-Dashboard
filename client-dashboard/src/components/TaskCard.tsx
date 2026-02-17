'use client'

import { Task, taskService } from '@/lib/taskService'
import { useState } from 'react'
import StatusBadge from './StatusBadge'
import UserAvatar from './UserAvatar'

interface TaskCardProps {
    task: Task & { assignee?: { role: string, display_name?: string } | null }
    isAdmin: boolean
    staffUsers?: { id: string, email: string, display_name?: string, role?: string }[]
    onDelete?: (id: string) => void
    onStatusChange?: (id: string, status: Task['status']) => void
    onAssigneeChange?: (id: string, assignedTo: string) => void
    currentUserId?: string
}

export default function TaskCard({ task, isAdmin, currentUserId, staffUsers, onDelete, onStatusChange, onAssigneeChange }: TaskCardProps) {
    const [showHistory, setShowHistory] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    const toggleHistory = async () => {
        if (!showHistory && history.length === 0) {
            setLoadingHistory(true)
            try {
                const data = await taskService.getHistory(task.id)
                setHistory(data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingHistory(false)
            }
        }
        setShowHistory(!showHistory)
    }

    const handleClaim = () => {
        if (currentUserId && onAssigneeChange) {
            onAssigneeChange(task.id, currentUserId)
        }
    }
    const isOverdue = (() => {
        if (task.status === 'completed' || !task.due_date) return false

        // Simple string comparison YYYY-MM-DD works best to avoid timezone issues
        const today = new Date()
        const todayStr = today.toLocaleDateString('en-CA') // YYYY-MM-DD format

        // task.due_date is YYYY-MM-DD
        return task.due_date < todayStr
    })()

    const [updating, setUpdating] = useState(false)

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUpdating(true)
        if (onStatusChange) {
            await onStatusChange(task.id, e.target.value as Task['status'])
        }
        setUpdating(false)
    }

    const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUpdating(true)
        if (onAssigneeChange) {
            await onAssigneeChange(task.id, e.target.value)
        }
        setUpdating(false)
    }

    // Resolve assignee name/email from staffUsers if available, or fallback
    const assigneeData = staffUsers?.find(u => u.id === task.assigned_to)
    const assigneeName = task.assignee?.display_name || assigneeData?.display_name || (task.assignee?.role ? `Staff (${task.assignee?.role})` : undefined)
    const assigneeEmail = assigneeData?.email || (task.assigned_to ? `User ${task.assigned_to.substring(0, 4)}` : undefined)

    return (
        <div className={`
            group relative bg-white rounded-xl shadow-sm border border-gray-100 p-5 
            transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
            ${isOverdue ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}
        `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                    </h3>
                    <StatusBadge status={task.status} isOverdue={isOverdue} />
                </div>

                {task.due_date && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded bg-gray-50 border border-gray-100 ${isOverdue ? 'text-red-700 bg-red-50 border-red-100' : 'text-gray-500'}`}>
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    {task.description}
                </p>
            )}

            {/* Footer / Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                {/* Assignee Section */}
                <div className="flex items-center gap-2">
                    {task.assigned_to ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserAvatar userId={task.assigned_to} email={assigneeEmail} name={assigneeName} size="sm" />
                            {!isAdmin ? (
                                <span className="text-xs font-medium">{assigneeName || assigneeEmail}</span>
                            ) : (
                                <span className="text-xs font-medium">{assigneeName || assigneeEmail}</span>
                            )}
                        </div>
                    ) : (
                        !isAdmin ? (
                            <button
                                onClick={handleClaim}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors"
                            >
                                + Claim Task
                            </button>
                        ) : (
                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )
                    )}

                    {isAdmin && staffUsers && onAssigneeChange && (
                        <select
                            value={task.assigned_to || ''}
                            onChange={handleAssigneeChange}
                            disabled={updating}
                            className="bg-transparent text-xs text-gray-500 font-medium focus:outline-none focus:text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1"
                            title="Change Assignee"
                        >
                            <option value="">{task.assigned_to ? '' : 'Assign...'}</option>
                            {staffUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.email}</option>
                            ))}
                            {task.assigned_to && <option value="">Unassign</option>}
                        </select>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-100">
                    <select
                        value={task.status}
                        onChange={handleStatusChange}
                        disabled={updating}
                        className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        title="Update Status"
                    >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    {isAdmin && onDelete && (
                        <button
                            onClick={() => onDelete(task.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Task"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* History Toggler */}
            <div className="mt-3 pt-3 border-t border-gray-50">
                <button
                    onClick={toggleHistory}
                    className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider flex items-center gap-1"
                >
                    {showHistory ? 'Hide History' : 'View History'}
                    <svg className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showHistory && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                        {loadingHistory ? (
                            <div className="text-center py-2 text-gray-400">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-2 text-gray-400">No history available</div>
                        ) : (
                            <ul className="space-y-2">
                                {history.map((h: any) => {
                                    const changer = staffUsers?.find(u => u.id === h.changed_by)
                                    const changerName = changer?.display_name || (changer?.email ? changer.email.split('@')[0] : 'Unknown')

                                    let message = ''
                                    let details = ''

                                    if (h.field_changed === 'status') {
                                        message = `changed status`
                                        details = `to ${h.new_value.replace('_', ' ')}`
                                    } else if (h.field_changed === 'assigned_to') {
                                        const oldUser = staffUsers?.find(u => u.id === h.old_value)
                                        const newUser = staffUsers?.find(u => u.id === h.new_value)
                                        const oldName = oldUser?.display_name || (oldUser?.email ? oldUser.email.split('@')[0] : 'Unassigned')
                                        const newName = newUser?.display_name || (newUser?.email ? newUser.email.split('@')[0] : 'Unassigned')

                                        if (!h.old_value || h.old_value === 'null') {
                                            if (h.new_value === h.changed_by) {
                                                message = 'claimed this task'
                                            } else {
                                                message = `assigned to ${newName}`
                                            }
                                        } else if (!h.new_value || h.new_value === 'null') {
                                            message = 'unassigned this task'
                                        } else {
                                            message = `reassigned to ${newName}`
                                        }
                                    } else {
                                        message = `updated ${h.field_changed}`
                                        details = `to ${h.new_value}`
                                    }

                                    return (
                                        <li key={h.id} className="flex flex-col gap-0.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <UserAvatar userId={h.changed_by} name={changerName} size="sm" />
                                                <span className="text-gray-900 font-bold flex items-center gap-1">
                                                    {changerName}
                                                    {changer?.role === 'admin' && (
                                                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded uppercase tracking-wider font-bold">Admin</span>
                                                    )}
                                                </span>
                                                <span className="text-gray-600 font-medium">{message}</span>
                                            </div>
                                            {details && (
                                                <span className="text-gray-600 pl-7 text-xs">
                                                    <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 capitalize">{details}</span>
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-400 pl-7">
                                                {new Date(h.changed_at).toLocaleString()}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
