import React from 'react';
import './Contact.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

const Contact = () => {
  return (
    <div className="contact-page">
      <Navbar />

      <main className="contact-main">
        <div className="contact-container">
          {/* Left Column */}
          <div className="contact-info">
            <span className="contact-label">CONTACT US</span>
            <h1 className="contact-title">We’d love to hear<br />from <span className="highlight">you.</span></h1>
            <p className="contact-desc">Have questions about IGNITE? Our team is here to help you understand how our platform can simplify your operations and drive growth.</p>

            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">
                  <img src="/images/Contact Main/Icon-2.svg" alt="Email" />
                </div>
                <div className="method-details">
                  <h3>Email Us</h3>
                  <p>info@ignite.com</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">
                  <img src="/images/Contact Main/Icon.svg" alt="Phone" />
                </div>
                <div className="method-details">
                  <h3>Call Us</h3>
                  <p>+91 98765 43210<br />Mon – Fri, 9:30 AM – 6:30 PM IST</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">
                  <img src="/images/Contact Main/Icon-1.svg" alt="Location" />
                </div>
                <div className="method-details">
                  <h3>Our Office</h3>
                  <p>IGNITE Technologies Pvt. Ltd.<br />Koramangala, Bengaluru – 560034, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="contact-form-container">
            <h2>Send us a message</h2>
            <p className="form-subtitle">Fill out the form and our team will get back to you shortly.</p>

            <form className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input type="text" placeholder="Enter your full name" required />
                </div>
                <div className="form-group">
                  <label>Work Email <span className="required">*</span></label>
                  <input type="email" placeholder="Enter your work email" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" placeholder="Enter your company name" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="Enter your phone number" />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Subject <span className="required">*</span></label>
                <input type="text" placeholder="How can we help?" required />
              </div>

              <div className="form-group full-width">
                <label>Message <span className="required">*</span></label>
                <textarea placeholder="Tell us more about your requirements…" required></textarea>
              </div>

              <div className="form-checkbox">
                <input type="checkbox" id="agree" required />
                <label htmlFor="agree">I agree to be contacted by IGNITE about my enquiry.</label>
              </div>

              <button type="submit" className="submit-btn">
                Send Message
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <p className="privacy-text">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 5.5H2.5C2.22386 5.5 2 5.72386 2 6V10.5C2 10.7761 2.22386 11 2.5 11H9.5C9.77614 11 10 10.7761 10 10.5V6C10 5.72386 9.77614 5.5 9.5 5.5Z" stroke="#203047" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.5 5.5V3.5C3.5 2.83696 3.76339 2.20107 4.23223 1.73223C4.70107 1.26339 5.33696 1 6 1C6.66304 1 7.29893 1.26339 7.76777 1.73223C8.23661 2.20107 8.5 2.83696 8.5 3.5V5.5" stroke="#203047" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                We respect your privacy. Your information is safe with us.
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
