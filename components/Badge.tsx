import { JSX } from "preact";

interface BadgeProps {
  variant?: "green" | "blue" | "gray" | "red";
  children: string | JSX.Element;
}

export default function Badge(
  { variant = "gray", children }: BadgeProps,
): JSX.Element {
  const variantClasses = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span class={`text-xs px-2 py-1 rounded ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
