interface UserAvatarProps {
    userId?: string
    email?: string
    name?: string
    size?: 'sm' | 'md'
}

export default function UserAvatar({ userId, email, name, size = 'md' }: UserAvatarProps) {
    // Generate deterministic color or initials based on ID/Email not fully possible with just ID unless we fetch, 
    // so we'll use a generic pleasing style.
    // If name is provided, use it. Else email.

    const token = name || email || 'U'
    const initials = token.substring(0, 2).toUpperCase()

    const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'

    return (
        <div className={`inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold ${sizeClasses} ring-2 ring-white`} title={name || email || userId}>
            {initials}
        </div>
    )
}
