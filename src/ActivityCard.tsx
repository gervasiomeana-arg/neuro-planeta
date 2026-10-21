import { ChevronRight, type LucideIcon } from 'lucide-react';

type ActivityCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'amber' | 'blue' | 'lavender' | 'rose' | 'aqua' | 'peach' | 'sage';
  onClick: () => void;
};

/** Shared, predictable entry point for every activity. */
export default function ActivityCard({ title, description, icon: Icon, tone, onClick }: ActivityCardProps) {
  return (
    <button type="button" className="np-activity-card" data-tone={tone} onClick={onClick}>
      <span className="np-activity-icon"><Icon aria-hidden="true" /></span>
      <span className="np-activity-copy">
        <span className="np-activity-title">{title}</span>
        <span className="np-activity-description">{description}</span>
      </span>
      <ChevronRight className="np-activity-arrow" aria-hidden="true" />
    </button>
  );
}
