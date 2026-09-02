import Card from '../common/Card/Card';
import SetupStep from './SetupStep';
import SETUP_STEPS from './setupSteps';
import './SetupChecklist.css';

export default function SetupChecklist({
  steps = SETUP_STEPS,
  onStepAction,
}) {
  const completedSteps = steps.filter(
    (step) => step.completed
  ).length;

  return (
    <Card
      title="Organization Setup Checklist"
      description="Track the configuration of your organization."
    >
      <div className="setup-checklist">
        {steps.map((step, index) => (
          <SetupStep
            key={step.title}
            number={index + 1}
            title={step.title}
            description={step.description}
            completed={step.completed}
            actionLabel={step.actionLabel}
            onAction={() => onStepAction?.(step, index)}
          />
        ))}
      </div>

      <div className="setup-checklist__summary">
        {completedSteps} of {steps.length} setup steps completed
      </div>
    </Card>
  );
}

