// Tag-cleaning rules shared by the upload form and the reports API. Has no server-only code.

export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 30;

/**
 * Trims each tag, drops blanks, and deduplicates case-insensitively,
 * keeping the first occurrence's casing.
 */
export function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(tag);
  }
  return cleaned;
}

/** Cleans the comma-separated text typed into the upload form's tag input. */
export function parseTags(input: string): string[] {
  return cleanTags(input.split(","));
}

/** The message for tags that break the count or length limit, or undefined if they fit. */
export function getTagsError(cleanedTags: string[]): string | undefined {
  if (cleanedTags.length > MAX_TAGS) return `Use at most ${MAX_TAGS} tags.`;
  const tooLong = cleanedTags.find((tag) => tag.length > MAX_TAG_LENGTH);
  if (tooLong) {
    return `"${tooLong}" is too long — tags can be at most ${MAX_TAG_LENGTH} characters.`;
  }
  return undefined;
}
