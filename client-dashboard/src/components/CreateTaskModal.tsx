'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { taskService, NewTask } from '@/lib/taskService'

interface CreateTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onTaskCreated: () => void
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [staffUsers, setStaffUsers] = useState<{ id: string, email: string, display_name?: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            const fetchStaff = async () => {
                try {
                    const { data, error } = await supabase.from('profiles').select('id, role, display_name').eq('role', 'staff')
                    if (error) {
                        console.error('Error fetching staff:', error)
                        return
                    }
                    if (data && Array.isArray(data)) {
                        setStaffUsers(data.map(p => ({
                            id: p.id,
                            email: `User ${(p.id || '').substring(0, 8)}...`,
                            display_name: p.display_name
                        })))
                    } else {
                        setStaffUsers([])
                    }
                } catch (err) {
                    console.error('Crash in fetchStaff:', err)
                }
            }
            fetchStaff()
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const newTask: NewTask = {
                title,
                description: description || null,
                due_date: dueDate || null,
                assigned_to: assignedTo || null,
                status: 'pending'
            }
            await taskService.createTask(newTask)
            onTaskCreated()
            handleClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setTitle('')
        setDescription('')
        setDueDate('')
        setAssignedTo('')
        setError('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 cursor-pointer"
            onClick={handleClose}
        >
            {/* Modal Panel */}
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Create New Task</h3>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-900 text-sm rounded-lg flex items-center gap-2 font-medium">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-1">Title</label>
                            <input
                                type="text"
                                id="title"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                                placeholder="Task title"
                            />
                        </div>

                        <div>
                            <label htmlFor="desc" className="block text-sm font-bold text-gray-900 mb-1">Description</label>
                            <textarea
                                id="desc"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                                placeholder="Details..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="due" className="block text-sm font-bold text-gray-900 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    id="due"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 font-medium"
                                />
                            </div>
                            <div>
                                <label htmlFor="assign" className="block text-sm font-bold text-gray-900 mb-1">Assign To</label>
                                <select
                                    id="assign"
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 font-medium"
                                >
                                    <option value="">Unassigned</option>
                                    {staffUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.display_name || user.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
