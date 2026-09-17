import { clamp } from "./model";

// Commit on blur so intermediate values such as an empty field or "1" do
// not get rejected while the user is typing a longer number like "125".
export default function NumberField({
  value,
  onCommit,
  min,
  max,
  step = 1,
  ...props
}) {
  return (
    <input
      {...props}
      key={value}
      type="number"
      defaultValue={value}
      min={min}
      max={max}
      step={step}
      onBlur={(event) => {
        const number = event.target.valueAsNumber;
        const next = Number.isFinite(number)
          ? clamp(Math.round(number / step) * step, min, max)
          : value;
        event.target.value = String(next);
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
