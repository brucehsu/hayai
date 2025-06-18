import { JSX } from "preact";

type ButtonVariant = "green" | "blue" | "red" | "gray";

interface ButtonProps {
  variant: ButtonVariant;
  children: JSX.Element | string;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  class?: string;
  onClick?: (e: Event) => void;
}

const getButtonStyles = (
  variant: ButtonVariant,
  disabled: boolean = false,
): string => {
  const baseStyles =
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  if (disabled) {
    return `${baseStyles} bg-gray-400 cursor-not-allowed text-white`;
  }

  return `${baseStyles} bg-${variant}-600 hover:bg-${variant}-700 text-white focus:ring-${variant}-500`;
};

export default function Button({
  variant,
  children,
  href,
  type = "button",
  disabled = false,
  class: additionalClass = "",
  onClick,
}: ButtonProps): JSX.Element {
  const buttonStyles = `${
    getButtonStyles(variant, disabled)
  } ${additionalClass}`;

  if (href) {
    return (
      <a href={href} class={buttonStyles}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      class={buttonStyles}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
