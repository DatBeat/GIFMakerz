import { getSizeCategory, formatSize } from '../utils/weightEstimator';

interface Props {
  bytes: number;
}

const colorMap = {
  green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function SizeIndicator({ bytes }: Props) {
  const category = getSizeCategory(bytes);
  const colors = colorMap[category];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      ~{formatSize(bytes)}
    </span>
  );
}
