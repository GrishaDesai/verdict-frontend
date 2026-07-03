import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import UploadCard from "./components/uploads/UploadCard";
import TriageTable, { type TriageResult } from "./components/table";
import Statistics from "./components/Statistics";
import { getTriageJob } from "./services/api"; // polls GET /triage/{job_id}
import TriageCards from "./components/Cards";

const POLL_INTERVAL_MS = 2000;

type JobStatus = "idle" | "processing" | "completed" | "failed";

function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [completedMessages, setCompletedMessages] = useState(0);
  const [results, setResults] = useState<TriageResult[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "cards">("cards");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Called by UploadCard once it has parsed the file and started the job.
  const handleJobStarted = (id: string, total: number) => {
    stopPolling();
    setJobId(id);
    setTotalMessages(total);
    setCompletedMessages(0);
    setResults([]);
    setError(null);
    setJobStatus("processing");
  };

  useEffect(() => {
    if (jobStatus !== "processing" || !jobId) return;

    const poll = async () => {
      try {
        const job = await getTriageJob(jobId);
        setCompletedMessages(job.completed_messages);

        if (job.status === "completed") {
          setResults(job.results);
          setJobStatus("completed");
          stopPolling();
        } else if (job.status === "failed") {
          setError("Triage job failed. Please try again.");
          setJobStatus("failed");
          stopPolling();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check job status");
        setJobStatus("failed");
        stopPolling();
      }
    };

    poll(); // check immediately, then on an interval
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return stopPolling;
  }, [jobStatus, jobId]);

  const stats = {
    totalMessages: completedMessages,
    processedMessages: results.length, // or filtered
    avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / (results.length || 1),
    avgTimeMs: results.reduce((sum, r) => sum + r.processing_time_ms, 0) / (results.length || 1),
    needsHumanCount: results.filter(r => r.flags.needs_human).length,
    estCost: (results.length * 0.001), // example $0.001 per message
    highPriorityCount: results.filter(r => r.priority === "P0").length,
    lowConfidenceCount: results.filter(r => r.flags.low_confidence).length,
    nonEnglishCount: results.filter(r => r.flags.non_english).length,
  };

  return (
    <div className="min-h-screen bg-background text-primary transition-colors duration-300">
      <Navbar />

      <main className="mx-auto max-w-7xl p-6">
        <UploadCard onJobStarted={handleJobStarted} />


        {jobStatus === "failed" && error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {jobStatus === "completed" && (
          <p className="mt-4 text-sm text-secondary">
            Triaged {totalMessages} message{totalMessages === 1 ? "" : "s"}.
          </p>
        )}

        <Statistics {...stats} />
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-10 mb-6">
          <button
            onClick={() => setView("cards")}
            className={`px-8 py-3 font-medium text-sm transition-all ${view === "cards"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Cards View
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-8 py-3 font-medium text-sm transition-all ${view === "table"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Table View
          </button>
        </div>
        {view === "cards" ? (
          <TriageCards results={results} />
        ) : (
          <TriageTable results={results} />
        )}
        {/* <div className="p-6">
          <TriageTable results={results} />
        </div> */}
      </main>
    </div>
  );
}

export default App;