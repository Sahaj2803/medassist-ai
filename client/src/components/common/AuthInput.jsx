import { forwardRef, useState } from "react";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

/**
 * Controlled-by-react-hook-form icon input for the Style B auth UI.
 * Pass {...register("field")} as props and an optional `error`
 * (from formState.errors.field). For type="password" a working
 * show/hide toggle is built in.
 */
const AuthInput = forwardRef(function AuthInput(
  { icon: Icon, label, id, error, type = "text", ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-mist-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-signal-400" />
        )}
        <input
          id={id}
          ref={ref}
          type={inputType}
          className={`w-full min-w-0 rounded-2xl border bg-graphite-950/60 py-3.5 pl-9 text-sm text-white
            placeholder:text-mist-400 shadow-input-inset transition-all duration-200
            focus:border-signal-400 focus:shadow-glow-teal focus:outline-none
            ${isPassword ? "pr-9" : "pr-3.5"}
            ${error ? "border-alert-500/70" : "border-white/[0.1]"}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 transition-colors hover:text-signal-400"
          >
            {visible ? (
              <HiOutlineEyeSlash className="h-4 w-4" />
            ) : (
              <HiOutlineEye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 pl-1 text-xs text-alert-400">{error.message}</p>
      )}
    </div>
  );
});

export default AuthInput;
