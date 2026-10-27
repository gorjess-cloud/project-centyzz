import HeaderActions from '../workspace/HeaderActions';

export default function SuperAdminHeader({ title, description }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#2A1E1B]">{title}</h1>
        <p className="mt-0.5 text-xs text-[#8A8174]">{description}</p>
      </div>
      <HeaderActions />
    </header>
  );
}
