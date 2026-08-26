import React from 'react';
import './Footer.css';

export default function Footer() {
  const footerSections = [
    {
      title: 'PRODUCTS',
      links: [
        {
          name: 'IGNITE HRMS',
          href: '#hrms',
          icon: '/images/Website Footer/Link/Icon-9.svg',
        },
        {
          name: 'IGNITE Field Sales',
          href: '#field-sales',
          icon: '/images/Website Footer/Link/Icon-8.svg',
        },
      ],
    },
    {
      title: 'COMPANY',
      links: [
        {
          name: 'About Us',
          href: '#about',
          icon: '/images/Website Footer/Link/Icon-7.svg',
        },
        {
          name: 'Contact Us',
          href: '#contact',
          icon: '/images/Website Footer/Link/Icon-6.svg',
        },
      ],
    },
    {
      title: 'RESOURCES',
      links: [
        {
          name: 'Help',
          href: '#help',
          icon: '/images/Website Footer/Link/Icon-5.svg',
        },
        {
          name: 'Documentation',
          href: '#docs',
          icon: '/images/Website Footer/Link/Icon-4.svg',
        },
        {
          name: 'FAQs',
          href: '#faqs',
          icon: '/images/Website Footer/Link/Icon-10.svg',
        },
      ],
    },
    {
      title: 'LEGAL',
      links: [
        {
          name: 'Privacy Policy',
          href: '#privacy',
          icon: '/images/Website Footer/Link/Icon-3.svg',
        },
        {
          name: 'Terms & Conditions',
          href: '#terms',
          icon: '/images/Website Footer/Link/Icon-2.svg',
        },
      ],
    },
    {
      title: 'CONTACT',
      links: [
        {
          name: 'hello@ignite.com',
          href: 'mailto:hello@ignite.com',
          icon: '/images/Website Footer/Link/Icon-6.svg',
        },
        {
          name: '+91 98765 43210',
          href: 'tel:+919876543210',
          icon: '/images/Website Footer/Link/Icon-1.svg',
        },
        {
          name: 'Bengaluru, India',
          href: '#location',
          icon: '/images/Website Footer/Link/Icon.svg',
        },
      ],
    },
  ];

  return (
    <footer className="ignite-footer">
      <div className="ignite-footer__container">
        <div className="ignite-footer__grid">
          {/* Brand Column */}
          <div className="ignite-footer__brand">
            <a href="/" className="ignite-footer__logo-wrap" aria-label="IGNITE Home">
              <img
                src="/images/Website Footer/Logo Mark/Footer.svg"
                alt="IGNITE Logo"
                className="ignite-footer__logo-img"
              />
              <span className="ignite-footer__logo-text">IGNITE</span>
            </a>

            <p className="ignite-footer__tagline">
              A connected platform for
              <br />
              managing people, sales and
              <br />
              business operations.
            </p>

            <div className="ignite-footer__brand-line" aria-hidden="true" />

            {/* Social Links */}
            <div className="ignite-footer__socials" aria-label="Social media links">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ignite-footer__social-btn"
                aria-label="LinkedIn"
              >
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 38C29.4934 38 38 29.4934 38 19C38 8.50659 29.4934 0 19 0C8.50659 0 0 8.50659 0 19C0 29.4934 8.50659 38 19 38Z" fill="#0E3044" />
                  <path d="M13 16H16V26H13V16ZM14.5 11.5C13.67 11.5 13 12.17 13 13C13 13.83 13.67 14.5 14.5 14.5C15.33 14.5 16 13.83 16 13C16 12.17 15.33 11.5 14.5 11.5ZM18 16H20.9V17.4C21.3 16.6 22.3 15.8 23.9 15.8C26.8 15.8 27.5 17.7 27.5 20.2V26H24.5V20.8C24.5 19.5 24.3 18.2 22.9 18.2C21.4 18.2 21 19.3 21 20.7V26H18V16Z" fill="white" />
                </svg>
              </a>

              {/* Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ignite-footer__social-btn"
                aria-label="Twitter"
              >
                <img src="/images/Website Footer/Twitter.svg" alt="Twitter" />
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ignite-footer__social-btn"
                aria-label="Facebook"
              >
                <img src="/images/Website Footer/Facebook.svg" alt="Facebook" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ignite-footer__social-btn"
                aria-label="YouTube"
              >
                <img src="/images/Website Footer/YouTube.svg" alt="YouTube" />
              </a>
            </div>
          </div>

          {/* Nav Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="ignite-footer__column">
              <h3 className="ignite-footer__column-title">{section.title}</h3>
              <ul className="ignite-footer__link-list">
                {section.links.map((link) => (
                  <li key={link.name} className="ignite-footer__link-item">
                    <a href={link.href} className="ignite-footer__link">
                      <img
                        src={link.icon}
                        alt=""
                        className="ignite-footer__link-icon"
                        aria-hidden="true"
                      />
                      <span>{link.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="ignite-footer__bottom">
          <p className="ignite-footer__copyright">
            © {new Date().getFullYear()} IGNITE. All rights reserved.
          </p>
        </div>
      </div>

      {/* Decorative Dotted Wave */}
      <img
        src="/images/Website Footer/Dotted Wave Artwork.svg"
        alt=""
        className="ignite-footer__artwork"
        aria-hidden="true"
      />
    </footer>
  );
}
