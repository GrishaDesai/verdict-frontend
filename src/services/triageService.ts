import { StartJobResponse, TriageResult } from "../types/triage";

const BASE_URL = "http://localhost:8000";

export async function startTriage(
    messages: string[]
): Promise<StartJobResponse> {
    const response = await fetch(`${BASE_URL}/triage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error("Failed to start triage job");
    }

    return response.json();
}

export async function getResults(
    jobId: string
): Promise<TriageResult[]> {
    const response = await fetch(`${BASE_URL}/results/${jobId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch results");
    }

    return response.json();
}