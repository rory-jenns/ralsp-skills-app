import React from 'react'

type AlertProps = {
    type?: 'error' | 'success' | 'info'
    message: string | null
}

export default function Alert({ type = 'info', message }: AlertProps) {
    if (!message) return null
    const base = 'rounded-3xl p-4 shadow-sm border'
    const styles: Record<string, string> = {
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        info: 'bg-amber-50 border-amber-200 text-amber-800'
    }
    return (
        <div role="alert" className={`${base} ${styles[type]}`}>
            <div className="font-medium">{message}</div>
        </div>
    )
}
