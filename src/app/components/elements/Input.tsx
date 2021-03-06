import { FC, HTMLProps, useState } from "react";
import classNames from "clsx";

type InputProps = {
  className?: string;
  label?: string;
  StartAdornment?: FC<{ className?: string }>;
  EndAdornment?: FC<{ className?: string }>;
} & HTMLProps<HTMLInputElement>;

const Input: FC<InputProps> = ({
  className,
  label,
  id,
  StartAdornment,
  EndAdornment,
  disabled,
  ...rest
}) => {
  const [focused, setFocused] = useState<boolean>(false);

  const adornmentClassNames = classNames(
    "w-5 h-5",
    "absolute top-1/2 -translate-y-1/2",
    "pointer-events-none",
    "transition-colors",
    focused && "fill-current text-brand-light",
    disabled && "fill-current text-brand-disabledcolor"
  );

  return (
    <div className={classNames("group flex flex-col text-base", className)}>
      {label && (
        <label htmlFor={id} className="pb-2 cursor-pointer text-brand-gray">
          {label}
        </label>
      )}
      <div className="relative">
        {!!StartAdornment && (
          <StartAdornment
            className={classNames(adornmentClassNames, "left-4")}
          />
        )}
        <input
          id={id}
          className={classNames(
            "w-full",
            "py-3 px-4",
            !!StartAdornment && "pl-10",
            !!EndAdornment && "pr-10",
            "box-border",
            "text-brand-light leading-none",
            "bg-black/20",
            "border border-brand-main/10",
            "rounded-[.625rem]",
            "outline-none",
            "cursor-pointer",
            "transition-colors",
            "placeholder-brand-placeholder",
            !disabled && [
              "group-hover:bg-brand-main/5",
              "group-hover:border-brand-main/5",
            ],
            focused && "border-brand-main/[.15]",
            disabled && [
              "bg-brand-disabledbackground/20",
              "border-brand-main/5",
              "text-brand-disabledcolor placeholder-brand-disabledcolor",
            ]
          )}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          {...rest}
        />
        {!!EndAdornment && (
          <EndAdornment
            className={classNames(adornmentClassNames, "right-4")}
          />
        )}
      </div>
    </div>
  );
};

export default Input;
