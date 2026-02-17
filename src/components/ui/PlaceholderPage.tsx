import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="card flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-amber-50 p-4">
          <Construction className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Coming Soon</h2>
        <p className="mt-1 text-sm text-gray-500">
          {description || `The ${title} page is under construction.`}
        </p>
      </div>
    </div>
  );
}
