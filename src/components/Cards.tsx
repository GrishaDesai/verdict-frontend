import React, { useState } from "react";
import type{ TriageResult } from "./table"; // Import from your table file

interface TriageCardsProps {
    results: TriageResult[];
}

export default function TriageCards({ results }: TriageCardsProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => {
                const isExpanded = expandedId === r.id;
                const confidencePct = Math.round(r.confidence * 100);

                return (
                    <div
                        key={r.id}
                        className="bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                        {/* Card Header */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full 
                                            ${r.priority === "P0" ? "bg-red-100 text-red-700" :
                                                r.priority === "P1" ? "bg-orange-100 text-orange-700" :
                                                    "bg-amber-100 text-amber-700"}`}>
                                            {r.priority}
                                        </span>
                                        <span className="capitalize font-medium text-gray-700">{r.category}</span>
                                    </div>
                                    <p className="mt-3 text-gray-800 font-medium leading-snug">
                                        {r.summary}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-500">Confidence</div>
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
                                        <div
                                            className="h-full bg-blue-600"
                                            style={{ width: `${confidencePct}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{confidencePct}%</span>
                                </div>

                                <div className={`text-xs px-3 py-1 rounded-full font-medium
                                    ${r.sentiment === "angry" ? "bg-red-100 text-red-700" :
                                        r.sentiment === "negative" ? "bg-orange-100 text-orange-700" :
                                            r.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                                                "bg-gray-100 text-gray-600"}`}>
                                    {r.sentiment}
                                </div>
                            </div>
                        </div>

                        {/* Expandable Content */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96" : "max-h-0"}`}
                        >
                            <div className="p-5 space-y-4 border-t border-gray-100">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Original Message</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {r.message}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Suggested Action</p>
                                    <p className="text-sm text-gray-700">{r.suggested_action}</p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Reasoning</p>
                                    <p className="text-sm text-gray-700">{r.reasoning}</p>
                                </div>

                                <div className="pt-2 text-xs text-gray-400">
                                    {r.id} • {r.processing_time_ms}ms
                                </div>
                            </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="w-full py-4 text-sm font-medium text-blue-600 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isExpanded ? "Hide Details ▲" : "Show Details ▼"}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}