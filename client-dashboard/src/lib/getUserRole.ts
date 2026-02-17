import { supabase } from './supabaseClient'
import { Database } from '@/types/database'

type UserRole = Database['public']['Tables']['profiles']['Row']['role']

export async function getUserRole(): Promise<UserRole | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return null

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error fetching user role:', JSON.stringify(error, null, 2))
            // Handle "Row not found" (PGRST116) specifically
            if (error.code === 'PGRST116') {
                console.warn('Profile not found for user. This might be an old user or trigger failed.')
                return null
            }
            return null
        }

        return data?.role as UserRole
    } catch (error) {
        console.error('Unexpected error fetching role:', error)
        return null
    }
}
