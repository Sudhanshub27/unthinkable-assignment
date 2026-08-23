import { ClipboardList, Megaphone, CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import { Button } from './UIComponents';

const ICON_MAP = {
  clipboard: ClipboardList,
  megaphone: Megaphone,
  'check-circle': CheckCircle2,
  mail: Mail,
  alert: AlertCircle,
};

export default function EmptyState({ illustration, icon = 'clipboard', title, description, actionText, onAction }) {
  const IconComponent = ICON_MAP[icon] || ClipboardList;

  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-4">
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className="w-48 h-auto max-w-full object-contain mb-2"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-paper-hover border border-line flex items-center justify-center text-ink-muted">
          <IconComponent className="w-7 h-7" />
        </div>
      )}
      <div className="space-y-1 max-w-md">
        <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>
        {description && <p className="text-sm text-ink-secondary leading-relaxed">{description}</p>}
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
