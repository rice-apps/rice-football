import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
  label?: ReactNode;
  hint?: ReactNode;
  /** Error message; also marks the select invalid. */
  error?: ReactNode;
  /** Renders a disabled, empty first option (e.g. "Choose a season…"). */
  placeholder?: string;
};

export function Select({ options, label, hint, error, placeholder, id, className, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  // Show the placeholder by default for uncontrolled selects.
  const defaultValue =
    props.value === undefined && props.defaultValue === undefined && placeholder !== undefined ? "" : props.defaultValue;

  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={selectId} className="ui-field__label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={["ui-select", className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
        defaultValue={defaultValue}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
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
