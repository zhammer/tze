import { forwardRef, useEffect } from "react";

/**
 * Off-screen input that captures the mobile virtual keyboard.
 * It auto-focuses on mount and re-grabs focus on blur so the
 * keyboard stays up while the user is typing.
 */
export const HiddenInput = forwardRef<HTMLInputElement>(function HiddenInput(
  _props,
  ref
) {
  const innerRef =
    typeof ref === "function" ? null : ref;

  // Auto-focus on mount.
  useEffect(() => {
    if (innerRef?.current) {
      innerRef.current.focus();
    }
  }, [innerRef]);

  return (
    <input
      ref={ref}
      aria-label="Type here"
      autoFocus
      inputMode="text"
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      className="hidden-input"
      onBlur={(e) => {
        // Small delay lets intentional blur (e.g. palette tap) settle
        // before re-grabbing focus.
        setTimeout(() => e.target.focus(), 10);
      }}
    />
  );
});
