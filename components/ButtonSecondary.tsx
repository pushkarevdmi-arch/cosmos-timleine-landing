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
      className="rounded-full border border-zinc-700 px-4 py-2 type-button-text text-zinc-100 hover:border-zinc-500 hover:text-white cursor-pointer"
    >
      {children}
    </button>
  );
}

