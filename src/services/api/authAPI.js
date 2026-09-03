import api from "./axios";

export const sendSignupOtp = async (email) => {
  const response = await api.post("/auth/signup/send-otp/", {
    email,
  });

  return response.data;
};

export const verifySignupOtp = async (email, otp) => {
  const response = await api.post("/auth/signup/verify-otp/", {
    email,
    otp,
  });

  return response.data;
};

export const completeSignup = async (
  email,
  verificationToken,
  password,
  confirmPassword
) => {
  const response = await api.post("/auth/signup/complete/", {
    email,
    verification_token: verificationToken,
    password,
    confirm_password: confirmPassword,
  });

  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login/", {
    email,
    password,
  });

  return response.data;
};


// ==========================================
// FORGOT PASSWORD
// ==========================================

export const sendForgotPasswordOtp = async (email) => {
  const response = await api.post(
    "/auth/forgot-password/send-otp/",
    {
      email,
    }
  );

  return response.data;
};


export const verifyForgotPasswordOtp = async (
  email,
  otp
) => {
  const response = await api.post(
    "/auth/forgot-password/verify-otp/",
    {
      email,
      otp,
    }
  );

  return response.data;
};


export const resetPassword = async (
  email,
  resetToken,
  password,
  confirmPassword
) => {
  const response = await api.post(
    "/auth/forgot-password/reset/",
    {
      email,
      reset_token: resetToken,
      password,
      confirm_password: confirmPassword,
    }
  );

  return response.data;
};