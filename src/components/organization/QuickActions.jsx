import { UserPlus, Building2, Award, Users } from 'lucide-react';
import Card from '../common/Card/Card';
import Button from '../common/Button/Button';
import './QuickActions.css';

const ACTIONS = [
  {
    label: 'Add Department',
    description: 'Quick insert',
    variant: 'outline',
  },
  {
    label: 'Add Designation',
    description: 'Quick insert',
    variant: 'outline',
  },
  {
    label: 'Add Employee',
    description: 'Quick insert',
    variant: 'outline',
  },
];

const ICONS = {
  'Add Department': Building2,
  'Add Designation': Award,
  'Add Employee': Users,
};

export default function QuickActions({ onAction }) {
  return (
    <Card
      title="Quick Actions"
    >
      <div className="quick-actions">
        {ACTIONS.map((action) => {
          const Icon = ICONS[action.label];
          return (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              onClick={() => onAction?.(action.label)}
            >
              <span className="quick-actions__item">
                {Icon && (
                  <span className="quick-actions__icon-box">
                    <Icon
                      className="quick-actions__icon"
                      size={18}
                      strokeWidth={2}
                    />
                  </span>
                )}
                <span className="quick-actions__text">
                  <span className="quick-actions__label">
                    {action.label}
                  </span>
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}