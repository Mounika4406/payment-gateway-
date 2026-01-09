export const isValidExpiry = (expiry) => {
  if (typeof expiry !== "string") return false;

  const match = expiry.match(/^(\d{2})\/(\d{2}|\d{4})$/);
  if (!match) return false;

  let month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);

  if (month < 1 || month > 12) return false;

  if (year < 100) {
    year += 2000;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
};
