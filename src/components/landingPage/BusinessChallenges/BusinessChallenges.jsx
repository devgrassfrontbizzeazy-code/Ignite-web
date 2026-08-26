import React from 'react';
import './BusinessChallenges.css';
import tealIllustration from '../../../assets/landing/Teal.png';
import greenIllustration from '../../../assets/landing/Green.png';
import orangeIllustration from '../../../assets/landing/Orange.png';
import navyIllustration from '../../../assets/landing/Navy.png';
import ecosystemIllustration from '../../../assets/landing/Connected Ecosystem Diagram.png';

const BusinessChallenges = () => {
  const challenges = [
    {
      id: 1,
      number: '01',
      title: 'Fragmented Information',
      description: 'Business information is distributed across multiple systems, making it difficult to maintain a consistent operational view.',
      badgeColor: '#05806B',
      illustrationBg: '#F0FAF8',
      dotColor: '#159D87',
      illustration: tealIllustration
    },
    {
      id: 2,
      number: '02',
      title: 'Manual Processes',
      description: 'Routine activities require unnecessary manual coordination and data handling.',
      badgeColor: '#059E52',
      illustrationBg: '#EFF9F3',
      dotColor: '#28A879',
      illustration: greenIllustration
    },
    {
      id: 3,
      number: '03',
      title: 'Limited Visibility',
      description: 'Managers may not have timely visibility into workforce activity, sales execution, and operational performance.',
      badgeColor: '#FF9900',
      illustrationBg: '#FFF7E9',
      dotColor: '#F0A000',
      illustration: orangeIllustration
    },
    {
      id: 4,
      number: '04',
      title: 'Disconnected Operations',
      description: 'Different teams may use separate tools and workflows, creating gaps in coordination and reporting.',
      badgeColor: '#081F36',
      illustrationBg: '#F6F7F8',
      dotColor: '#8093A2',
      illustration: navyIllustration
    }
  ];

  const features = [
    { icon: '✓', label: 'Centralized Management' },
    { icon: '✓', label: 'Connected Workflows' },
    { icon: '✓', label: 'Role-Based Access' },
    { icon: '✓', label: 'Operational Visibility' },
    { icon: '✓', label: 'Process Automation' },
    { icon: '✓', label: 'Scalable Structure' }
  ];

  return (
    <section className="business-challenges">
      {/* Decorative dotted sides */}
      <div className="challenges-background-dots"></div>

      {/* Section Header */}
      <div className="challenges-header">
        <div className="eyebrow">BUSINESS CHALLENGES</div>
        <div className="eyebrow-underline"></div>
        <h2 className="section-title">Challenges that slow <span className="highlight">businesses down</span></h2>
        <p className="section-description">
          Disconnected systems, manual work and limited visibility create roadblocks<br />
          that impact productivity, decision-making and growth.
        </p>
      </div>

      {/* Challenge Cards */}
      <div className="challenges-frame">
        <div className="challenge-cards-container">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="challenge-card">
              <div className="card-illustration" style={{ backgroundColor: challenge.illustrationBg }}>
                <img className="challenge-illustration-image" src={challenge.illustration} alt="" />
                {/* Illustration placeholder - styled background */}
                <div className="illustration-content">
                  <svg viewBox="0 0 276 150" preserveAspectRatio="xMidYMid meet">
                    {/* Decorative pattern elements */}
                    <defs>
                      <pattern id={`dots-${challenge.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="2" fill={challenge.dotColor} opacity="0.3" />
                      </pattern>
                    </defs>
                    <rect width="276" height="150" fill={challenge.illustrationBg} />
                    <rect width="276" height="150" fill={`url(#dots-${challenge.id})`} />
                  </svg>
                </div>
              </div>

              <div className="card-content">
                <div className="card-title-row">
                  <div className="number-badge" style={{ backgroundColor: challenge.badgeColor }}>
                    {challenge.number}
                  </div>
                  <h3 className="card-title">{challenge.title}</h3>
                </div>
                <p className="card-description">{challenge.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* IGNITE Overview Panel */}
        <div className="ignite-overview-panel">
          {/* Background dots decoration */}
          <div className="panel-dots"></div>

          {/* Overview Content */}
          <div className="overview-content">
            <div className="overview-eyebrow">IGNITE OVERVIEW</div>
            <div className="overview-underline"></div>
            <h3 className="overview-title">One platform. <span className="overview-highlight">Connected ecosystem</span></h3>
            <p className="overview-description">
              IGNITE brings your people, processes and operations together in a single platform built to simplify the way businesses work.
            </p>

            <div className="feature-grid">
              <div className="feature-column">
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <span>Centralized Management</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <span>Connected Workflows</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <span>Role-Based Access</span>
                </div>
              </div>
              <div className="feature-column">
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <span>Operational Visibility</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <span>Process Automation</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <span>Scalable Structure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Divider */}
          <div className="panel-divider"></div>

          {/* Ecosystem Diagram */}
          <div className="ecosystem-diagram">
            <img className="ecosystem-illustration-image" src={ecosystemIllustration} alt="Connected ecosystem diagram" />
            {/* HRMS Card */}
            <div className="solution-card hrms-card">
              <div className="product-header">
                <div className="product-icon hrms-icon">
                  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="44" height="44" rx="8" fill="#10B89E" />
                    <g opacity="0.8">
                      <line x1="14" y1="16" x2="22" y2="16" stroke="white" strokeWidth="1.76" strokeLinecap="round" />
                      <line x1="24" y1="16" x2="32" y2="16" stroke="white" strokeWidth="1.76" strokeLinecap="round" />
                      <line x1="14" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.76" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>
                <div className="product-labels">
                  <div className="product-brand">IGNITE</div>
                  <div className="product-name">HRMS</div>
                </div>
              </div>
              <div className="product-divider"></div>
              <p className="product-description">Manage your workforce and HR operations efficiently.</p>
            </div>

            {/* Hub Center */}
            <div className="ignite-hub">
              <div className="hub-rings">
                <div className="hub-ring ring-1"></div>
                <div className="hub-ring ring-2"></div>
                <div className="hub-ring ring-3"></div>
              </div>
              <div className="hub-hexagon">
                <svg viewBox="0 0 154 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M77 5L141.24 49.5V138.5L77 183L12.76 138.5V49.5L77 5Z" fill="white" stroke="#A7FFF1" strokeWidth="2" />
                </svg>
                <div className="ignite-mark">
                  <svg viewBox="0 0 61.52 64.84" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20.81" y="11.74" width="20.79" height="20.79" fill="#01857B" rx="2" />
                    <rect x="0" y="0" width="20.79" height="20.79" fill="#04373E" rx="2" />
                    <circle cx="31" cy="46" r="8" fill="#EBA420" />
                  </svg>
                </div>
              </div>
              <div className="ignite-label">IGNITE</div>
            </div>

            {/* Field Sales Card */}
            <div className="solution-card field-sales-card">
              <div className="product-header">
                <div className="product-icon field-sales-icon">
                  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="44" height="44" rx="8" fill="#FF9800" />
                    <g opacity="0.8">
                      <circle cx="16" cy="16" r="2" stroke="white" strokeWidth="1.936" />
                      <line x1="18" y1="20" x2="22" y2="20" stroke="white" strokeWidth="1.936" strokeLinecap="round" />
                      <line x1="27" y1="12" x2="27" y2="28" stroke="white" strokeWidth="1.936" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>
                <div className="product-labels">
                  <div className="product-brand">IGNITE</div>
                  <div className="product-name">FIELD SALES</div>
                </div>
              </div>
              <div className="product-divider"></div>
              <p className="product-description">Empower your field team and drive sales performance.</p>
            </div>

            {/* Network Connectors - SVG paths */}
            <svg className="network-connectors" viewBox="0 0 699 274" preserveAspectRatio="xMidYMid meet">
              {/* Left connectors to hub */}
              <line x1="120" y1="96" x2="234" y2="96" stroke="#23E3C4" strokeWidth="2" opacity="0.7" />
              <circle cx="120" cy="96" r="3" fill="#23E3C4" />
              <circle cx="234" cy="96" r="3" fill="#23E3C4" />

              {/* Right connectors from hub */}
              <line x1="465" y1="96" x2="579" y2="96" stroke="#FFA000" strokeWidth="2" opacity="0.7" />
              <circle cx="465" cy="96" r="3" fill="#FFA000" />
              <circle cx="579" cy="96" r="3" fill="#FFA000" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessChallenges;