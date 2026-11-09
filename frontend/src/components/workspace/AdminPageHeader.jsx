import HeaderActions from "./HeaderActions";
export default function AdminPageHeader({
  title,
  subtitle,
  showHeaderActions = true,
  children,
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#2A1E1B]">{title}</h1>
        <p className="mt-0.5 text-xs leading-relaxed text-[#8A8174]">
          {subtitle}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {children}
        {showHeaderActions && <HeaderActions />}
      </div>
    </header>
  );
}
