type ButtonSecondaryProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

export default function ButtonSecondary({
  children,
  onClick,
  type = "button",
}: ButtonSecondaryProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded-full border border-ds-neutral-700 px-4 py-2 type-button-text text-ds-neutral-100 hover:border-ds-neutral-500 hover:text-ds-neutral-00 cursor-pointer"
    >
      {children}
    </button>
  );
}

