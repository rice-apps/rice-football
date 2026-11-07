import { useId, type ComponentProps, type ReactNode } from "react";

// ComponentProps (rather than TextareaHTMLAttributes) includes `ref`, so callers can focus the textarea.
type TextareaProps = ComponentProps<"textarea"> & {
  label?: ReactNode;
  hint?: ReactNode;
  /** Error message; also marks the textarea invalid. */
  error?: ReactNode;
};

// Multi-line version of Input, with the same label, hint, and error layout.
export function Textarea({ label, hint, error, id, className, rows = 5, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={textareaId} className="ui-field__label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={["ui-input", "ui-textarea", className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && (
        <p id={hintId} className="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
