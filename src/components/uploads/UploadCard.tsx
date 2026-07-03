import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
    UploadCloud,
    FileText,
    CheckCircle2,
    Loader2,
    X,
    AlertCircle,
    Play,
} from "lucide-react";
import { startTriageJob } from "../../services/api";

const SUPPORTED_TYPES = [".csv", ".json", ".txt", ".xlsx", ".pdf"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadCardProps {
    onJobStarted: (jobId: string, totalMessages: number) => void;
}

const UploadCard = ({ onJobStarted }: UploadCardProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateFile = (file: File) => {
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!extension || !SUPPORTED_TYPES.includes(`.${extension}`)) {
            return "Unsupported file format.";
        }

        if (file.size === 0) {
            return "Selected file is empty.";
        }

        if (file.size > MAX_FILE_SIZE) {
            return "Maximum allowed file size is 10 MB.";
        }

        return null;
    };

    // ---- message extraction ----

    const findMessageKey = (row: Record<string, unknown>): string | null => {
        const keys = Object.keys(row);
        const preferred = keys.find((k) => /^(message|text|content|complaint|query)$/i.test(k.trim()));
        if (preferred) return preferred;
        return keys.length === 1 ? keys[0] : null;
    };

    const extractFromRows = (rows: Record<string, unknown>[]): string[] => {
        if (rows.length === 0) return [];
        const key = findMessageKey(rows[0]);

        return rows
            .map((row) => {
                if (key) return String(row[key] ?? "").trim();
                // no obvious single column, join all string-ish values as fallback
                return Object.values(row)
                    .map((v) => String(v ?? "").trim())
                    .filter(Boolean)
                    .join(" ");
            })
            .filter((msg) => msg.length > 0);
    };

    const parseCsv = async (file: File): Promise<string[]> => {
        const Papa = (await import("papaparse")).default;
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(extractFromRows(results.data as Record<string, unknown>[])),
                error: (err: Error) => reject(err),
            });
        });
    };

    const parseJson = async (file: File): Promise<string[]> => {
        const text = await file.text();
        const data = JSON.parse(text);

        if (Array.isArray(data)) {
            if (data.length === 0) return [];
            if (typeof data[0] === "string") return (data as string[]).map((s) => s.trim()).filter(Boolean);
            return extractFromRows(data as Record<string, unknown>[]);
        }

        if (typeof data === "object" && data !== null) {
            const arrayField = Object.values(data).find((v) => Array.isArray(v)) as unknown[] | undefined;
            if (arrayField) {
                if (typeof arrayField[0] === "string") return (arrayField as string[]).map((s) => s.trim()).filter(Boolean);
                return extractFromRows(arrayField as Record<string, unknown>[]);
            }
        }

        throw new Error("Unrecognized JSON structure.");
    };

    const parseTxt = async (file: File): Promise<string[]> => {
        const text = await file.text();
        return text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    };

    const parseXlsx = async (file: File): Promise<string[]> => {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as Record<string, unknown>[];
        return extractFromRows(rows);
    };

    const parsePdf = async (file: File): Promise<string[]> => {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        const lines: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
            lines.push(
                ...pageText
                    .split(/\n|(?<=[.?!])\s+/)
                    .map((s) => s.trim())
                    .filter(Boolean),
            );
        }
        return lines;
    };

    const extractMessages = async (file: File): Promise<string[]> => {
        const extension = file.name.split(".").pop()?.toLowerCase();

        switch (extension) {
            case "csv":
                return parseCsv(file);
            case "json":
                return parseJson(file);
            case "txt":
                return parseTxt(file);
            case "xlsx":
                return parseXlsx(file);
            case "pdf":
                return parsePdf(file);
            default:
                throw new Error("Unsupported file format.");
        }
    };

    // ---- dropzone wiring ----

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;

        const file = acceptedFiles[0];
        const validation = validateFile(file);

        if (validation) {
            setError(validation);
            setSelectedFile(null);
            return;
        }

        setError("");
        setSelectedFile(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        noClick: true,
        multiple: false,
        accept: {
            "text/csv": [".csv"],
            "application/json": [".json"],
            "text/plain": [".txt"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/pdf": [".pdf"],
        },
    });

    const removeFile = () => {
        setSelectedFile(null);
        setError("");
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setError("");

        try {
            const messages = await extractMessages(selectedFile);

            console.log(messages);
            
            if (messages.length === 0) {
                throw new Error("No messages could be extracted from this file.");
            }

            const { job_id, total_messages } = await startTriageJob(messages);
            onJobStarted(job_id, total_messages);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed p-8 transition-all duration-300
        ${isDragActive ? "border-accent bg-accent/5 scale-[1.01]" : "border-border hover:border-accent/60"}`}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-5">
                        <div className="rounded-xl bg-accent/10 p-4 h-fit">
                            <UploadCloud size={30} className="text-accent" />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-primary">Upload Customer Dataset</h2>
                            <p className="mt-1 text-secondary">Drag & drop your dataset or browse files.</p>
                            <p className="mt-1 text-sm text-secondary">CSV • JSON • TXT • XLSX • PDF</p>

                            {selectedFile && (
                                <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <CheckCircle2 className="mt-0.5 text-green-500" size={20} />
                                            <div>
                                                <p className="font-medium text-primary">{selectedFile.name}</p>
                                                <p className="text-sm text-secondary">{formatFileSize(selectedFile.size)}</p>
                                            </div>
                                        </div>
                                        <button onClick={removeFile} className="rounded-lg p-1 hover:bg-red-500/10">
                                            <X size={18} className="text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-500">
                                    <AlertCircle size={18} />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={open}
                            disabled={loading}
                            className="rounded-xl border border-border bg-background px-6 py-3 font-medium transition hover:border-accent hover:bg-accent hover:text-white"
                        >
                            Browse Files
                        </button>

                        <button
                            disabled={!selectedFile || loading}
                            onClick={handleAnalyze}
                            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    Analyze Dataset
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    {SUPPORTED_TYPES.map((type) => (
                        <div
                            key={type}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-secondary"
                        >
                            <FileText size={15} />
                            {type}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UploadCard;