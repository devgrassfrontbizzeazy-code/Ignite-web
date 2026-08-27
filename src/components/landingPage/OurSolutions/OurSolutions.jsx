import React from "react";
import "./OurSolutions.css";
import hrmsIconImg from "../../../assets/landing/hrms-icon.png";
import fieldIconImg from "../../../assets/landing/field-icon.png";
import hrmsImage from "../../../assets/landing/hrms.png";
import fieldSalesImage from "../../../assets/landing/field-sales.png";

const OurSolutions = () => {
  return (
    <section className="our-solutions">
      {/* Section Header */}
      <div className="section-header">
        <div className="eyebrow">OUR SOLUTIONS</div>
        <div className="eyebrow-underline"></div>
        <h2 className="section-title">
          Solutions built for{" "}
          <span className="highlight-teal">your business</span>
        </h2>
        <p className="section-description">
          IGNITE offers two powerful solutions that work seamlessly together to
          help you manage your people and drive your field operations.
        </p>
      </div>

      {/* HRMS Card */}
      <div className="solution-card hrms-card">
        <div className="card-content">
          {/* HRMS Branding */}
          <div className="product-header">
            <div className="icon-box hrms-icon">
              <img src={hrmsIconImg} alt="HRMS Icon" className="icon-image" />
            </div>
            <div className="product-name">
              <div className="brand">IGNITE</div>
              <div className="product-title hrms-title">HRMS</div>
            </div>
          </div>

          {/* Description */}
          <p className="product-description">
            Streamline and automate your HR operations
            <br />
            to build a productive and engaged workforce.
          </p>

          {/* Feature Grid */}
          <div className="feature-grid">
            <div className="feature-column">
              <div className="feature-item">
                <div className="check-icon hrms-check"></div>
                <span>Employee Management</span>
              </div>
              <div className="feature-item">
                <div className="check-icon hrms-check"></div>
                <span>Attendance</span>
              </div>
              <div className="feature-item">
                <div className="check-icon hrms-check"></div>
                <span>Leave Management</span>
              </div>
            </div>
            <div className="feature-column">
              <div className="feature-item">
                <div className="check-icon hrms-check"></div>
                <span>Payroll</span>
              </div>
              <div className="feature-item">
                <div className="check-icon hrms-check"></div>
                <span>Recruitment</span>
              </div>
              <div className="feature-item">
                <div className="check-icon hrms-check"></div>
                <span>Performance Management</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="cta-button hrms-cta">
            Explore HRMS
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Dashboard Image */}
        <div className="card-visual">
          <img
            src={hrmsImage}
            alt="HRMS Dashboard"
            className="dashboard-image"
          />
        </div>
      </div>

      {/* Field Sales Card */}
      <div className="solution-card field-sales-card">
        <div className="card-content">
          {/* Field Sales Branding */}
          <div className="product-header">
            <div className="icon-box field-sales-icon">
              <img
                src={fieldIconImg}
                alt="Field Sales Icon"
                className="icon-image"
              />
            </div>
            <div className="product-name">
              <div className="brand">IGNITE</div>
              <div className="product-title field-sales-title">FIELD SALES</div>
            </div>
          </div>

          {/* Description */}
          <p className="product-description">
            Empower your field team with the tools
            <br />
            they need to sell smarter and achieve more.
          </p>

          {/* Feature Grid */}
          <div className="feature-grid">
            <div className="feature-column">
              <div className="feature-item">
                <div className="check-icon field-sales-check"></div>
                <span>Lead Management</span>
              </div>
              <div className="feature-item">
                <div className="check-icon field-sales-check"></div>
                <span>Customer Visits</span>
              </div>
              <div className="feature-item">
                <div className="check-icon field-sales-check"></div>
                <span>Sales Activity</span>
              </div>
            </div>
            <div className="feature-column">
              <div className="feature-item">
                <div className="check-icon field-sales-check"></div>
                <span>Attendance</span>
              </div>
              <div className="feature-item">
                <div className="check-icon field-sales-check"></div>
                <span>Location Tracking</span>
              </div>
              <div className="feature-item">
                <div className="check-icon field-sales-check"></div>
                <span>Sales Monitoring</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="cta-button field-sales-cta">
            Explore Field Sales
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Field Sales Workflow */}
        <div className="card-visual field-sales-visual">
          <div className="workflow-container">
            <div className="workflow-steps">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <div className="step-title">Plan Your Day</div>
                  <div className="step-description">
                    View your tasks, planned visits and priorities.
                  </div>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <div className="step-title">Track Your Visit</div>
                  <div className="step-description">
                    Log visit details, capture notes and follow-ups.
                  </div>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <div className="step-title">Monitor Performance</div>
                  <div className="step-description">
                    Stay updated on your activity and sales progress.
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Phones with Connectors */}
            <div className="workflow-phones-wrapper">
              <svg
                className="workflow-connectors"
                viewBox="0 0 600 300"
                preserveAspectRatio="none"
              >
                {/* First connector: thick wavy line from phone 1 to phone 2 */}
                <path
                  d="M 85 150 Q 140 105 200 150 T 320 150"
                  stroke="#FF8A00"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Second connector: thick wavy line from phone 2 to phone 3 */}
                <path
                  d="M 320 150 Q 375 105 435 150 T 555 150"
                  stroke="#FF8A00"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="workflow-phones">
                <img
                  src={fieldSalesImage}
                  alt="Field Sales Mobile Screens"
                  className="mobile-phones-image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurSolutions;
