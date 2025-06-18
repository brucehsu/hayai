import { JSX } from "preact";

type ButtonVariant = "create" | "submit" | "cancel" | "google";

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

  switch (variant) {
    case "create":
      return `${baseStyles} bg-create hover:bg-create-hover text-white focus:ring-create`;
    case "submit":
      return `${baseStyles} bg-submit hover:bg-submit-hover text-white focus:ring-submit`;
    case "cancel":
      return `${baseStyles} bg-cancel hover:bg-cancel-hover text-white focus:ring-cancel`;
    case "google":
      // Keep Google button styling unchanged
      return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
    default:
      return `${baseStyles} bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500`;
  }
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
