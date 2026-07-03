import React from "react";

interface TriageStatsProps {
    totalMessages: number;
    processedMessages: number;
    avgConfidence: number;        // 0 to 1
    avgTimeMs: number;
    needsHumanCount: number;
    estCost: number;
    highPriorityCount?: number;
    lowConfidenceCount?: number;
    nonEnglishCount?: number;
}

export default function TriageStats({
    totalMessages,
    processedMessages,
    avgConfidence,
    avgTimeMs,
    needsHumanCount,
    estCost,
    highPriorityCount = 0,
    lowConfidenceCount = 0,
    nonEnglishCount = 0,
}: TriageStatsProps) {
    const progress = totalMessages > 0 ? Math.round((processedMessages / totalMessages) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Top Status Pills */}
            <div className="flex flex-wrap gap-3">
                {needsHumanCount > 0 && (
                    <div className="bg-red-100 text-red-700 text-sm font-medium px-5 py-2 rounded-2xl">
                        Needs human • {needsHumanCount}
                    </div>
                )}
                {lowConfidenceCount > 0 && (
                    <div className="bg-amber-100 text-amber-700 text-sm font-medium px-5 py-2 rounded-2xl">
                        Low confidence • {lowConfidenceCount}
                    </div>
                )}
                {nonEnglishCount > 0 && (
                    <div className="bg-purple-100 text-purple-700 text-sm font-medium px-5 py-2 rounded-2xl">
                        Non-English • {nonEnglishCount}
                    </div>
                )}
                {highPriorityCount > 0 && (
                    <div className="bg-red-100 text-red-700 text-sm font-medium px-5 py-2 rounded-2xl">
                        High priority • {highPriorityCount}
                    </div>
                )}
            </div>

            {/* Messages Count */}
            <div className="flex items-center justify-between">
                <p className="text-lg font-medium text-gray-700">
                    {processedMessages} of {totalMessages} messages
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-gray-700">Processing messages</p>
                    <span className="font-semibold text-gray-900">{progress}%</span>
                </div>

                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm">Avg confidence</p>
                    <p className="text-4xl font-semibold text-gray-900 mt-3">
                        {Math.round(avgConfidence * 100)}%
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm">Avg time / msg</p>
                    <p className="text-4xl font-semibold text-gray-900 mt-3">
                        {avgTimeMs.toFixed(1)}<span className="text-xl font-normal text-gray-400">s</span>
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm">Needs human</p>
                    <p className="text-4xl font-semibold text-gray-900 mt-3">{needsHumanCount}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm">Est. cost</p>
                    <p className="text-4xl font-semibold text-gray-900 mt-3">
                        ${estCost.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}