import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../auth'
import Alert from '../components/Alert'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const
type Level = typeof LEVELS[number]
const UNREGISTERED = 'unregistered' as const
const IGNORED = 'ignored' as const
type Column = Level | typeof UNREGISTERED
const DEFAULT_ORDER: Column[] = [UNREGISTERED, ...LEVELS]

export default function MySkills() {
    const auth = useAuth()
    const [userSkills, setUserSkills] = useState<any[]>([])
    const [skills, setSkills] = useState<any[]>([])
    const [ignoredIds, setIgnoredIds] = useState<string[]>([])
    const [columnOrder, setColumnOrder] = useState<Column[]>(DEFAULT_ORDER)
    const [dragSkillId, setDragSkillId] = useState<string | null>(null)
    const [dragEntryId, setDragEntryId] = useState<string | null>(null)
    const [dragColumn, setDragColumn] = useState<Column | null>(null)
    const [overColumn, setOverColumn] = useState<Column | typeof IGNORED | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null)

    useEffect(() => {
        if (!auth.user?.id) return
        Promise.all([
            axios.get(`/api/users/${auth.user.id}/skills`),
            axios.get('/api/skills'),
            axios.get(`/api/users/${auth.user.id}/ignored-skills`),
        ]).then(([userSkillsRes, skillsRes, ignoredRes]) => {
            setUserSkills(userSkillsRes.data)
            setSkills(skillsRes.data)
            setIgnoredIds(ignoredRes.data)
        }).catch(() => {
            showResult('Failed to load skills.', 'error')
        })
    }, [auth.user?.id])

    const skillName = (skillId: string) =>
        skills.find(s => s.id === skillId)?.name || skillId

    const registeredIds = new Set(userSkills.map(s => s.skill_id))
    const ignoredSet = new Set(ignoredIds)

    // A skill is in exactly one place: registered (in a level), ignored, or unregistered
    const unregistered = skills.filter(s => !registeredIds.has(s.id) && !ignoredSet.has(s.id))
    const ignored = skills.filter(s => ignoredSet.has(s.id) && !registeredIds.has(s.id))

    const showResult = (text: string, type: 'error' | 'success') => {
        setMessage(text)
        setMessageType(type)
    }

    const clearDrag = () => {
        setDragSkillId(null)
        setDragEntryId(null)
        setDragColumn(null)
        setOverColumn(null)
    }

    // Swap a column into the position of another column
    const moveColumn = (from: Column, to: Column) => {
        if (from === to) return
        setColumnOrder(prev => {
            const fromIdx = prev.indexOf(from)
            const toIdx = prev.indexOf(to)
            const next = prev.filter(c => c !== from)
            const insertAt = next.indexOf(to) + (fromIdx < toIdx ? 1 : 0)
            next.splice(insertAt, 0, from)
            return next
        })
    }

    // Existing entry: change its level
    const changeLevel = async (entryId: string, level: Level) => {
        const entry = userSkills.find(s => s.id === entryId)
        if (!entry || entry.level === level) return

        const previous = userSkills
        setUserSkills(prev => prev.map(s => (s.id === entryId ? { ...s, level } : s)))
        try {
            await axios.put(`/api/user-skills/${entryId}`, { level })
            showResult(`Moved to ${level}.`, 'success')
        } catch (error: any) {
            setUserSkills(previous)
            showResult(error.response?.data?.error || 'Failed to update level.', 'error')
        }
    }

    // Unregistered or ignored skill: add at a level (un-ignoring it first if needed)
    const addSkill = async (skillId: string, level: Level) => {
        if (!auth.user?.id) return
        try {
            if (ignoredSet.has(skillId)) {
                await axios.delete(`/api/users/${auth.user.id}/ignored-skills/${skillId}`)
                setIgnoredIds(prev => prev.filter(id => id !== skillId))
            }
            const res = await axios.post(`/api/users/${auth.user.id}/skills`, { skill_id: skillId, level })
            setUserSkills(prev => [...prev, res.data])
            showResult(`Added ${skillName(skillId)} at ${level}.`, 'success')
        } catch (error: any) {
            showResult(error.response?.data?.error || 'Failed to add skill.', 'error')
        }
    }

    // Registered entry: remove it (it becomes unregistered)
    const removeSkill = async (entryId: string) => {
        const previous = userSkills
        setUserSkills(prev => prev.filter(s => s.id !== entryId))
        try {
            await axios.delete(`/api/user-skills/${entryId}`)
            showResult('Skill removed.', 'success')
        } catch (error: any) {
            setUserSkills(previous)
            showResult(error.response?.data?.error || 'Failed to remove skill.', 'error')
        }
    }

    // Unregistered skill: move into the Ignored box
    const ignoreSkill = async (skillId: string) => {
        if (!auth.user?.id) return
        setIgnoredIds(prev => [...prev, skillId])
        try {
            await axios.post(`/api/users/${auth.user.id}/ignored-skills`, { skill_id: skillId })
            showResult(`Ignoring ${skillName(skillId)}.`, 'success')
        } catch (error: any) {
            setIgnoredIds(prev => prev.filter(id => id !== skillId))
            showResult(error.response?.data?.error || 'Failed to ignore skill.', 'error')
        }
    }

    // Ignored skill: move back to Unregistered
    const unignoreSkill = async (skillId: string) => {
        if (!auth.user?.id) return
        const previous = ignoredIds
        setIgnoredIds(prev => prev.filter(id => id !== skillId))
        try {
            await axios.delete(`/api/users/${auth.user.id}/ignored-skills/${skillId}`)
            showResult(`Restored ${skillName(skillId)}.`, 'success')
        } catch (error: any) {
            setIgnoredIds(previous)
            showResult(error.response?.data?.error || 'Failed to restore skill.', 'error')
        }
    }

    // Move every ignored skill back to Unregistered
    const restoreAllIgnored = async () => {
        if (!auth.user?.id || ignoredIds.length === 0) return
        const previous = ignoredIds
        setIgnoredIds([])
        try {
            const res = await axios.delete(`/api/users/${auth.user.id}/ignored-skills`)
            showResult(`Restored ${res.data.restored} skill(s).`, 'success')
        } catch (error: any) {
            setIgnoredIds(previous)
            showResult(error.response?.data?.error || 'Failed to restore skills.', 'error')
        }
    }

    const handleDrop = (column: Column | typeof IGNORED) => {
        if (column === UNREGISTERED) {
            if (dragEntryId) removeSkill(dragEntryId)
            else if (dragSkillId && ignoredSet.has(dragSkillId)) unignoreSkill(dragSkillId)
        } else if (column === IGNORED) {
            if (dragEntryId) showResult('Remove this skill from your levels before ignoring it.', 'error')
            else if (dragSkillId && !ignoredSet.has(dragSkillId)) ignoreSkill(dragSkillId)
        } else {
            if (dragEntryId) changeLevel(dragEntryId, column)
            else if (dragSkillId) addSkill(dragSkillId, column)
        }
        clearDrag()
    }

    // Drop handlers for a column. Skill drags go to handleDrop; column drags reorder.
    // stop = true for the Ignored box, which sits inside the Unregistered column.
    const columnHandlers = (column: Column | typeof IGNORED, stop = false) => ({
        onDragOver: (e: React.DragEvent) => {
            if (dragColumn) {
                // Let the outer column handle reordering
                if (!stop) e.preventDefault()
                if (!stop) setOverColumn(column)
                return
            }
            e.preventDefault()
            if (stop) e.stopPropagation()
            setOverColumn(column)
        },
        onDragLeave: (e: React.DragEvent) => {
            if (!dragColumn && stop) e.stopPropagation()
            setOverColumn(null)
        },
        onDrop: (e: React.DragEvent) => {
            if (dragColumn) {
                if (stop) return // bubbles to the outer column, which does the reorder
                e.preventDefault()
                moveColumn(dragColumn, column as Column)
                clearDrag()
                return
            }
            e.preventDefault()
            if (stop) e.stopPropagation()
            handleDrop(column)
        },
    })

    const renderCard = (key: string, name: string, onStart: (e: React.DragEvent) => void, dragging: boolean) => (
        <div
            key={key}
            draggable
            onDragStart={onStart}
            onDragEnd={clearDrag}
            className={`cursor-grab rounded border border-slate-200 bg-slate-50 p-3 active:cursor-grabbing ${dragging ? 'opacity-50' : ''
                }`}
        >
            <div className="font-medium">{name}</div>
        </div>
    )

    const startSkillDrag = (skillId: string) => (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', skillId)
        e.dataTransfer.effectAllowed = 'move'
        setDragSkillId(skillId)
        setDragEntryId(null)
    }

    const startEntryDrag = (entryId: string) => (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', entryId)
        e.dataTransfer.effectAllowed = 'move'
        setDragEntryId(entryId)
        setDragSkillId(null)
    }

    // Column headers are the handles for reordering
    const startColumnDrag = (column: Column) => (e: React.DragEvent) => {
        e.dataTransfer.setData('application/x-column', column)
        e.dataTransfer.effectAllowed = 'move'
        setDragColumn(column)
    }

    const columnBody = 'flex-1 space-y-2 overflow-y-auto p-3'
    const columnStyle = { maxHeight: '70vh' }
    const columnClass = (column: Column) =>
        `flex flex-col rounded border shadow-sm ${overColumn === column && (dragColumn || dragSkillId || dragEntryId)
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 bg-white'
        }`

    const renderUnregisteredColumn = () => (
        <div className={columnClass(UNREGISTERED)} {...columnHandlers(UNREGISTERED)}>
            <div
                draggable
                onDragStart={startColumnDrag(UNREGISTERED)}
                onDragEnd={clearDrag}
                title="Drag to reorder"
                className="cursor-move border-b border-slate-200 p-3 font-semibold"
            >
                <span className="mr-2 text-slate-400">⠿</span>
                Unregistered <span className="text-sm font-normal text-slate-500">({unregistered.length})</span>
            </div>

            <div className="p-3 pb-0">
                <div
                    {...columnHandlers(IGNORED, true)}
                    className={`flex flex-col rounded border border-dashed ${overColumn === IGNORED && (dragSkillId || dragEntryId)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-slate-100'
                        }`}
                >
                    <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Ignored ({ignored.length})
                    </div>
                    <div className="h-20 space-y-1 overflow-y-auto p-2">
                        {ignored.map(skill => (
                            <div
                                key={skill.id}
                                draggable
                                onDragStart={e => { e.stopPropagation(); startSkillDrag(skill.id)(e) }}
                                onDragEnd={clearDrag}
                                className={`cursor-grab rounded border border-slate-200 bg-white px-2 py-1 text-sm active:cursor-grabbing ${dragSkillId === skill.id ? 'opacity-50' : ''
                                    }`}
                            >
                                {skill.name}
                            </div>
                        ))}
                        {ignored.length === 0 && (
                            <div className="text-xs text-slate-400">Drop skills here to hide them</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={columnBody} style={columnStyle}>
                {unregistered.map(skill =>
                    renderCard(skill.id, skill.name, startSkillDrag(skill.id), dragSkillId === skill.id)
                )}
                {unregistered.length === 0 && (
                    <div className="text-sm text-slate-400">Nothing left to add</div>
                )}
            </div>
        </div>
    )

    const renderLevelColumn = (level: Level) => {
        const cards = userSkills.filter(s => s.level === level)
        return (
            <div className={columnClass(level)} {...columnHandlers(level)}>
                <div
                    draggable
                    onDragStart={startColumnDrag(level)}
                    onDragEnd={clearDrag}
                    title="Drag to reorder"
                    className="cursor-move border-b border-slate-200 p-3 font-semibold capitalize"
                >
                    <span className="mr-2 text-slate-400">⠿</span>
                    {level} <span className="text-sm font-normal text-slate-500">({cards.length})</span>
                </div>
                <div className={columnBody} style={columnStyle}>
                    {cards.map(card =>
                        renderCard(card.id, skillName(card.skill_id), startEntryDrag(card.id), dragEntryId === card.id)
                    )}
                    {cards.length === 0 && (
                        <div className="text-sm text-slate-400">Drop skills here</div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">My skills</h2>
                        <p className="text-slate-600">
                            Drag a skill from &quot;Unregistered&quot; into a level to add it. Drop it on the &quot;Ignored&quot; box to hide it
                            without adding it. Drag between levels to change your level, and drag back to &quot;Unregistered&quot; to remove it.
                            Drag a column header (⠿) onto another column to reorder columns.
                        </p>
                    </div>
                    <button
                        onClick={restoreAllIgnored}
                        disabled={ignored.length === 0}
                        className="shrink-0 rounded bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Restore all ignored
                    </button>
                </div>
                {message && <div className="mt-4"><Alert type={messageType ?? 'info'} message={message} /></div>}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {columnOrder.map(column => (
                    <React.Fragment key={column}>
                        {column === UNREGISTERED ? renderUnregisteredColumn() : renderLevelColumn(column)}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}