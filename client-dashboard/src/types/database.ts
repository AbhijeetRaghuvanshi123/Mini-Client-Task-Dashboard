export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'staff' | 'admin'
                    created_at: string
                }
                Insert: {
                    id: string
                    role?: 'staff' | 'admin'
                    created_at?: string
                }
                Update: {
                    id?: string
                    role?: 'staff' | 'admin'
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    status: 'pending' | 'in_progress' | 'completed'
                    assigned_to: string | null
                    due_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    status?: 'pending' | 'in_progress' | 'completed'
                    assigned_to?: string | null
                    due_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    status?: 'pending' | 'in_progress' | 'completed'
                    assigned_to?: string | null
                    due_date?: string | null
                    created_at?: string
                }
            }
        }
    }
}
