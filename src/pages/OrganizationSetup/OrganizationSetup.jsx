import SetupProgress from '../../components/organization/SetupProgress';
import SetupChecklist from '../../components/organization/SetupChecklist';
import QuickActions from '../../components/organization/QuickActions';
import './OrganizationSetup.css';

export default function OrganizationSetup() {
  const handleStepAction = (step) => {
    console.log('Setup action:', step.title);
  };

  const handleQuickAction = (action) => {
    console.log('Quick action:', action);
  };

  return (
    <main className="organization-setup">
      <div className="organization-setup__container">

        {/* Page Header */}
        <header className="organization-setup__header">
          <div>
            <h1>Organization Setup</h1>

            <p>
              Complete the steps below to get your workspace ready.
            </p>
          </div>
        </header>

        {/* Progress */}
        <SetupProgress
          completedSteps={2}
          totalSteps={12}
        />

        {/* Main Content */}
        <div className="organization-setup__grid">

          <SetupChecklist
            onStepAction={handleStepAction}
          />

          <QuickActions
            onAction={handleQuickAction}
          />

        </div>

      </div>
    </main>
  );
}