// Mock for 'entities' package to avoid ESM/CommonJS conflicts
module.exports = {
  isEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  isURL: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  isMobilePhone: () => false,
  isPostalCode: () => false,
};
