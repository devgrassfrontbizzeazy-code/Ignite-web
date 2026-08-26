import React from 'react';
import Navbar from '../../components/landingPage/Navbar/Navbar';
import Hero from '../../components/landingPage/Hero/Hero';
import BusinessChallenges from '../../components/landingPage/BusinessChallenges/BusinessChallenges';
import CoreCapabilities from '../../components/landingPage/CoreCapabilities/CoreCapabilities';
import HowIgniteWorks from '../../components/landingPage/HowIgniteWorks/HowIgniteWorks';
import BusinessValue from '../../components/landingPage/BusinessValue/BusinessValue';
import Footer from '../../components/landingPage/Footer/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <BusinessChallenges />
      <CoreCapabilities />
      <HowIgniteWorks />
      <BusinessValue />
      <Footer />
    </div>
  );
};

export default HomePage;