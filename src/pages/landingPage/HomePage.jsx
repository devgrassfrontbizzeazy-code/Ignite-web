import React from 'react';
import Navbar from '../../components/landingPage/Navbar/Navbar';
import Hero from '../../components/landingPage/Hero/Hero';
import BusinessChallenges from '../../components/landingPage/BusinessChallenges/BusinessChallenges';
import Footer from '../../components/landingPage/Footer/Footer';
import BusinessValue from '../../components/landingPage/BusinessValue/BusinessValue';
import HowIgniteWorks from '../../components/landingPage/HowIgniteWorks/HowIgniteWorks';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <BusinessChallenges />
      <HowIgniteWorks />
      <BusinessValue />
      <Footer />
    </div>
  );
};

export default HomePage;