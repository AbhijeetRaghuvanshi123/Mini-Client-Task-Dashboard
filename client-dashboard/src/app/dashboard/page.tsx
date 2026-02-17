'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getUserRole } from '@/lib/getUserRole'
import { taskService, Task } from '@/lib/taskService'
import TaskCard from '@/components/TaskCard'
import FilterTabs from '@/components/FilterTabs'
import CreateTaskModal from '@/components/CreateTaskModal'
import LoadingState from '@/components/LoadingState'
import EmptyState from '@/components/EmptyState'
import UserAvatar from '@/components/UserAvatar'

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'pending' | 'in_progress' | 'completed' | 'all'>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [staffUsers, setStaffUsers] = useState<{ id: string, email: string }[]>([])
    const [counts, setCounts] = useState({ all: 0, pending: 0, in_progress: 0, completed: 0 })

    const [currentUser, setCurrentUser] = useState<{ display_name?: string } | null>(null)

    const router = useRouter()

    useEffect(() => {
        checkUser()
    }, [filter])

    useEffect(() => {
        fetchCounts()
    }, [tasks])

    const fetchCounts = async () => {
        const { count: all } = await supabase.from('tasks').select('*', { count: 'exact', head: true })
        const { count: pending } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        const { count: in_progress } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
        const { count: completed } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed')

        setCounts({
            all: all || 0,
            pending: pending || 0,
            in_progress: in_progress || 0,
            completed: completed || 0
        })
    }

    const checkUser = async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        setUserId(session.user.id)

        // Fetch full profile for current user
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, display_name')
            .eq('id', session.user.id)
            .single()

        const role = profile?.role || 'staff'
        setUserRole(role)
        setCurrentUser({ display_name: profile?.display_name })

        // Fetch directory of users (for history lookup & admin dropdowns)
        // Note: RLS must allow this for staff to see names in history
        const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, role, display_name') // email might be restricted

        if (allProfiles) {
            setStaffUsers(allProfiles.map(p => ({
                id: p.id,
                email: p.display_name || `User ${p.id.substring(0, 8)}`, // Fallback for dropdowns
                display_name: p.display_name,
                role: p.role
            })))
        }

        loadTasks(filter)
    }

    const loadTasks = async (status: string = 'all') => {
        setLoading(true)
        try {
            const data = await taskService.getTasks(status)
            setTasks(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTask = () => {
        loadTasks(filter)
        setIsModalOpen(false)
    }

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            await taskService.deleteTask(id)
            setTasks(tasks.filter(t => t.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const handleStatusChange = async (id: string, status: Task['status']) => {
        try {
            setTasks(tasks.map(t => t.id === id ? { ...t, status } : t))
            await taskService.updateTask(id, { status })
            if (filter !== 'all' && filter !== status) {
                loadTasks(filter)
            }
        } catch (error) {
            console.error(error)
            loadTasks(filter)
        }
    }

    const handleAssigneeChange = async (id: string, assignedTo: string) => {
        try {
            const assigneeValue = assignedTo === '' ? null : assignedTo
            await taskService.updateTask(id, { assigned_to: assigneeValue })
            setTasks(prev => prev.map(t => t.id === id ? { ...t, assigned_to: assigneeValue } : t))
        } catch (error) {
            alert('Failed to verify assignment')
            console.error(error)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const sortedTasks = [...tasks].sort((a, b) => {
        const isOverdueA = a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()
        const isOverdueB = b.status !== 'completed' && b.due_date && new Date(b.due_date) < new Date()
        if (isOverdueA && !isOverdueB) return -1
        if (!isOverdueA && isOverdueB) return 1
        return 0
    })

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 rounded-lg p-1.5">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Task Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                            <UserAvatar userId={userId || undefined} name={currentUser?.display_name} size="sm" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-900 leading-none">
                                    {currentUser?.display_name || (userRole === 'admin' ? 'Administrator' : 'Staff Member')}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
                                    {userRole?.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage and track your team's progress</p>
                    </div>

                    {userRole === 'admin' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Task
                        </button>
                    )}
                </div>

                <FilterTabs currentFilter={filter} onFilterChange={setFilter} counts={counts} />

                {loading ? (
                    <LoadingState />
                ) : tasks.length === 0 ? (
                    <EmptyState onAction={userRole === 'admin' ? () => setIsModalOpen(true) : undefined} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {sortedTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isAdmin={userRole === 'admin'}
                                staffUsers={staffUsers}
                                currentUserId={userId || undefined}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                                onAssigneeChange={handleAssigneeChange}
                            />
                        ))}
                    </div>
                )}
            </main>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={handleCreateTask}
            />
        </div>
    )
}