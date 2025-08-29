export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateRequired = (value) => {
  return value.trim() !== '';
};

export const validatePhoneNumber = (phone) => {
  const regex = /^\+?[1-9]\d{1,14}$/;
  return regex.test(phone);
};

export const validateDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
};