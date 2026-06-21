/**
 * General utility and helper functions
 */

// Format a date to a standard string (YYYY-MM-DD)
export const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Calculate a win rate percentage safely
export const calculateWinRate = (won, total) => {
  if (!total || total === 0) return '0.00';
  return ((won / total) * 100).toFixed(2);
};

// Generate a random alphanumeric reference string (Useful for manual transaction references)
export const generateReference = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};