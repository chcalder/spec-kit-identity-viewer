import { type GraphProfile } from '../types/graph';

interface ProfileCardProps {
  profile: GraphProfile;
}

const FIELD_LABELS: { key: keyof GraphProfile; label: string }[] = [
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'officeLocation', label: 'Office Location' },
  { key: 'preferredLanguage', label: 'Preferred Language' },
];

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Corporate Profile
        </h2>
      </div>
      <dl>
        {FIELD_LABELS.map(({ key, label }, index) => (
          <div
            key={key}
            className={`flex px-4 py-3 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}`}
          >
            <dt className="w-48 text-sm font-medium text-gray-400 shrink-0">{label}</dt>
            <dd className="text-sm text-gray-100 font-mono">
              {profile[key] ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
