import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types — mirror the backend's TriageResult / TriageFlags models
// ---------------------------------------------------------------------------

export interface TriageFlags {
    needs_human: boolean;
    low_confidence: boolean;
    non_english: boolean;
    injection_detected: boolean;
}

export interface TriageResult {
    id: string;
    message: string;
    category: string;
    priority: "P0" | "P1" | "P2" | "P3";
    summary: string;
    suggested_action: string;
    confidence: number;
    sentiment: "positive" | "neutral" | "negative" | "angry";
    reasoning: string;
    flags: TriageFlags;
    processing_time_ms: number;
}

interface TriageTableProps {
    results: TriageResult[];
}

// ---------------------------------------------------------------------------
// Small display helpers
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<TriageResult["priority"], string> = {
    P0: "bg-red-100 text-red-700 border-red-200",
    P1: "bg-orange-100 text-orange-700 border-orange-200",
    P2: "bg-amber-100 text-amber-700 border-amber-200",
    P3: "bg-slate-100 text-slate-600 border-slate-200",
};

const SENTIMENT_STYLES: Record<TriageResult["sentiment"], string> = {
    positive: "bg-emerald-100 text-emerald-700",
    neutral: "bg-slate-100 text-slate-600",
    negative: "bg-orange-100 text-orange-700",
    angry: "bg-red-100 text-red-700",
};

const FLAG_LABELS: Record<keyof TriageFlags, string> = {
    needs_human: "Needs human",
    low_confidence: "Low confidence",
    non_english: "Non-English",
    injection_detected: "Injection attempt",
};

function PriorityBadge({ priority }: { priority: TriageResult["priority"] }) {
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
        >
            {priority}
        </span>
    );
}

function SentimentBadge({ sentiment }: { sentiment: TriageResult["sentiment"] }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SENTIMENT_STYLES[sentiment]}`}
        >
            {sentiment}
        </span>
    );
}

function ConfidenceBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color =
        pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
    return (
        <div className="flex items-center gap-2 w-24">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-slate-500 w-8 text-right">{pct}%</span>
        </div>
    );
}

function FlagBadges({ flags }: { flags: TriageFlags }) {
    const active = (Object.keys(flags) as (keyof TriageFlags)[]).filter((k) => flags[k]);
    if (active.length === 0) return <span className="text-xs text-slate-400">—</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {active.map((key) => (
                <span
                    key={key}
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium border ${key === "injection_detected"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                >
                    {FLAG_LABELS[key]}
                </span>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

type SortKey = "priority" | "confidence" | "category" | "sentiment";

const PRIORITY_ORDER: Record<TriageResult["priority"], number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export default function TriageTable({ results }: TriageTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>("priority");
    const [sortAsc, setSortAsc] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = useMemo(
        () => ["all", ...Array.from(new Set(results.map((r) => r.category)))],
        [results]
    );

    const rows = useMemo(() => {
        let filtered =
            categoryFilter === "all" ? results : results.filter((r) => r.category === categoryFilter);

        filtered = [...filtered].sort((a, b) => {
            let cmp = 0;
            if (sortKey === "priority") cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            else if (sortKey === "confidence") cmp = a.confidence - b.confidence;
            else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
            else if (sortKey === "sentiment") cmp = a.sentiment.localeCompare(b.sentiment);
            return sortAsc ? cmp : -cmp;
        });

        return filtered;
    }, [results, sortKey, sortAsc, categoryFilter]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    }

    function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
        const active = sortKey === sortKeyName;
        return (
            <button
                type="button"
                onClick={() => toggleSort(sortKeyName)}
                className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${active ? "text-slate-900" : "text-slate-400"
                    } hover:text-slate-700`}
            >
                {label}
                <span className="text-[10px]">{active ? (sortAsc ? "▲" : "▼") : ""}</span>
            </button>
        );
    }

    if (results.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No triage results yet.
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500">
                    {rows.length} of {results.length} message{results.length === 1 ? "" : "s"}
                </p>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c === "all" ? "All categories" : c}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-3 py-2 text-left"><SortHeader label="Priority" sortKeyName="priority" /></th>
                            <th className="px-3 py-2 text-left"><SortHeader label="Category" sortKeyName="category" /></th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Summary
                            </th>
                            <th className="px-3 py-2 text-left"><SortHeader label="Sentiment" sortKeyName="sentiment" /></th>
                            <th className="px-3 py-2 text-left"><SortHeader label="Confidence" sortKeyName="confidence" /></th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Flags
                            </th>
                            <th className="px-3 py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const expanded = expandedId === r.id;
                            return (
                                <>
                                    <tr
                                        key={r.id}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => setExpandedId(expanded ? null : r.id)}
                                    >
                                        <td className="px-3 py-2 align-top"><PriorityBadge priority={r.priority} /></td>
                                        <td className="px-3 py-2 align-top capitalize text-slate-700">{r.category}</td>
                                        <td className="px-3 py-2 align-top text-slate-700 max-w-sm truncate">{r.summary}</td>
                                        <td className="px-3 py-2 align-top"><SentimentBadge sentiment={r.sentiment} /></td>
                                        <td className="px-3 py-2 align-top"><ConfidenceBar value={r.confidence} /></td>
                                        <td className="px-3 py-2 align-top"><FlagBadges flags={r.flags} /></td>
                                        <td className="px-3 py-2 align-top text-slate-400 text-xs">{expanded ? "▲" : "▼"}</td>
                                    </tr>
                                    {expanded && (
                                        <tr key={`${r.id}-detail`} className="bg-slate-50/60 border-b border-slate-100">
                                            <td colSpan={7} className="px-3 py-3">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Original message</p>
                                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.message}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Suggested action</p>
                                                        <p className="text-sm text-slate-700 mb-2">{r.suggested_action}</p>
                                                        <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Reasoning</p>
                                                        <p className="text-sm text-slate-700">{r.reasoning}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    {r.id} · {r.processing_time_ms}ms
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}