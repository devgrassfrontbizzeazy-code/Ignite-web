import ProgressBar from '../common/ProgressBar/ProgressBar';
import SETUP_STEPS from './setupSteps';
import './SetupProgress.css';

export default function SetupProgress({
  steps = SETUP_STEPS,
}) {
  const totalSteps = steps.length;

  const completedSteps = steps.filter(
    (step) => step.completed
  ).length;

  const progress =
    totalSteps > 0
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

  return (
    <div className="setup-progress">
      <div className="setup-progress__top">
        <div>
          <span className="setup-progress__label">
            Setup progress
          </span>

          <span className="setup-progress__count">
            {completedSteps} of {totalSteps} steps completed
          </span>
        </div>

        <span className="setup-progress__percentage">
          {progress}%
        </span>
      </div>

      <ProgressBar
        value={progress}
        size="sm"
      />
    </div>
  );
}

