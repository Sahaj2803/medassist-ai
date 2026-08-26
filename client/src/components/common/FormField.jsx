import { forwardRef } from "react";

/**
 * Controlled-by-react-hook-form text input. Pass {...register("field")}
 * as props and an optional `error` (from formState.errors.field).
 */
const FormField = forwardRef(function FormField(
  { label, id, error, type = "text", ...rest },
  ref
) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-mist-100">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        type={type}
        className={`w-full rounded-lg border bg-white/[0.04] px-3.5 py-2.5 text-sm text-white
          placeholder:text-mist-400 transition-colors
          focus:border-signal-400 focus:outline-none
          ${error ? "border-alert-500" : "border-white/10"}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-alert-400">{error.message}</p>}
    </div>
  );
});

export default FormField;
