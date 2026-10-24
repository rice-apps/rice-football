export type JsonShape = "array-of-objects" | "object" | "array" | "primitive";

export type ParseJsonResult =
  | { ok: true; data: unknown; shape: JsonShape }
  | { ok: false; error: string };

// True for `{ }` objects; false for arrays and null.
export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Classifies parsed JSON into a JsonShape.
function detectShape(value: unknown): JsonShape {
    if (Array.isArray(value)) {
        return value.length > 0 && value.every(isPlainObject)
        ? "array-of-objects"
        : "array"
    }
    if (isPlainObject(value)) return "object";
    return "primitive";
}

// Parses JSON text without throwing.
export function parseJson(text: string): ParseJsonResult {
    if (text.trim() === "") {
        return { ok: false, error: "File is empty." };
    }

    try {
        const data: unknown = JSON.parse(text);
        return { ok: true, data, shape: detectShape(data) };
    }   catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: `Invalid JSON: ${message}` };
    }
}