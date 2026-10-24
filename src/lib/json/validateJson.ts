import { isPlainObject } from "./parseJson";

export type FieldType = "string" | "number" | "boolean" | "array" | "object";

export type FieldRule = { type: FieldType; required: boolean };

export type JsonSchema = Record<string, FieldRule>;

export type ValidationIssue = {
    recordIndex: number | null;
    field: string | null;
    message: string;
};

function describeType(value: unknown): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
}

function validateRecord(
    record: Record<string, unknown>,
    schema: JsonSchema,
    recordIndex: number | null,
): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const[field, rule] of Object.entries(schema)) {
        if (!Object.hasOwn(record, field)) {
            if (rule.required) {
                issues.push({ recordIndex, field, message: `Missing required field "${field}".` });
            }
            continue;
        }
        const actual = describeType(record[field]);
        if (actual !== rule.type) {
            issues.push({ recordIndex, field, message: `"${field}" should be ${rule.type} but is ${actual}.` });
        }
    }
    return issues;
}

export function validateJson(data: unknown, schema: JsonSchema): ValidationIssue[] {
    if (isPlainObject(data)) {
        return validateRecord(data, schema, null);
    }
    if (Array.isArray(data)) {
        return data.flatMap((item, index) =>
            isPlainObject(item)
                ? validateRecord(item, schema, index)
                : [{ recordIndex: index, field: null, message: `Expected an object but found ${describeType(item)}.` }],
        );
    }

    return [
        {
            recordIndex: null,
            field: null,
            message: `Expected an object or an array of objects but found ${describeType(data)}.`,
        },
    ];
}