import Joi from "joi";

export const registerValidation = Joi.object({
  name: Joi.string().min(3).max(50).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).required()
});


export const sendOtpValidation = Joi.object({
  email: Joi.string().email().required()
});


export const verifyOtpValidation = Joi.object({
  userId: Joi.string().length(24).hex().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()  // Length is 6 and Must be digits only  
});


export const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

