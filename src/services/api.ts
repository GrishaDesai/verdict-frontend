const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export interface TriageJobResponse {
    job_id: string;
    total_messages: number;
}

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

export interface TriageJobStatus {
    job_id: string;
    status: "processing" | "completed" | "failed";
    total_messages: number;
    completed_messages: number;
    results: TriageResult[];
}

export async function startTriageJob(messages: string[]): Promise<TriageJobResponse> {
    const response = await fetch(`${API_URL}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error(`Failed to start triage job: ${response.statusText}`);
    }

    return response.json();
}

export async function getTriageJob(jobId: string): Promise<TriageJobStatus> {
    const response = await fetch(`${API_URL}/triage/${jobId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch triage job: ${response.statusText}`);
    }

    return response.json();
}