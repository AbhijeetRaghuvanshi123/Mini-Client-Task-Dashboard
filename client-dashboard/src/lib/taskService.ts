import { supabase } from './supabaseClient'
import { Database } from '@/types/database'

export type Task = Database['public']['Tables']['tasks']['Row']
export type NewTask = Database['public']['Tables']['tasks']['Insert']
export type UpdateTask = Database['public']['Tables']['tasks']['Update']

export const taskService = {
    async getTasks(status?: string) {
        let query = supabase
            .from('tasks')
            .select(`
        *,
        assignee:profiles(id, role, display_name) 
      `)
            .order('due_date', { ascending: true })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching tasks:', JSON.stringify(error, null, 2))
            throw error
        }
        return data
    },

    async getTasksByStatus(status: Task['status']) {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', status)
            .order('due_date', { ascending: true })

        if (error) throw error
        return data
    },

    async createTask(task: NewTask) {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateTask(id: string, updates: UpdateTask) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deleteTask(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async claimTask(taskId: string, userId: string) {
        const { data, error } = await supabase
            .from('tasks')
            .update({ assigned_to: userId })
            .eq('id', taskId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getHistory(taskId: string) {
        const { data, error } = await supabase
            .from('task_history')
            .select('*')
            .eq('task_id', taskId)
            .order('changed_at', { ascending: false })

        // Note: fetch sender email via edge function or ignore if not critical. 
        // For audit, showing ID or Role is acceptable.

        if (error) {
            console.error('History fetch error (table might not exist yet):', error)
            return []
        }
        return data
    }
}
