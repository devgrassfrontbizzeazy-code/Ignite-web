import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/landingPage/Navbar/Navbar';
import Hero from '../../components/landingPage/Hero/Hero';
import BusinessChallenges from '../../components/landingPage/BusinessChallenges/BusinessChallenges';
import CoreCapabilities from '../../components/landingPage/CoreCapabilities/CoreCapabilities';
import HowIgniteWorks from '../../components/landingPage/HowIgniteWorks/HowIgniteWorks';
import BusinessValue from '../../components/landingPage/BusinessValue/BusinessValue';
import Footer from '../../components/landingPage/Footer/Footer';
import OurSolutions from '../../components/landingPage/OurSolutions/OurSolutions';

import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    const refreshToken =
      localStorage.getItem("refreshToken") ||
      localStorage.getItem("refresh_token");

    if (accessToken || refreshToken) {
      let storedUser = {};
      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch (e) {
        storedUser = {};
      }
      const target = storedUser?.is_field_sales === true ? "/field-sales" : "/dashboard";
      navigate(target, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <BusinessChallenges />
      <OurSolutions />
      <CoreCapabilities />
      <HowIgniteWorks />
      <BusinessValue />
      <Footer />
    </div>
  );
};

export default HomePage;