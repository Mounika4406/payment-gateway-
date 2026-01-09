export const isValidVPA = (vpa) => {
  if (typeof vpa !== "string") return false;

  const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return vpaRegex.test(vpa);
};
