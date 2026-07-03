export interface Flags {
    needs_human: boolean;
    low_confidence: boolean;
    non_english: boolean;
    injection_detected: boolean;
}

export interface TriageResult {
    id: string;
    message: string;
    category: string;
    priority: string;
    summary: string;
    suggested_action: string;
    confidence: number;
    sentiment: string;
    reasoning: string;
    processing_time_ms: number;
    flags: Flags;
}

export interface StartJobResponse {
    job_id: string;
    total_messages: number;
}