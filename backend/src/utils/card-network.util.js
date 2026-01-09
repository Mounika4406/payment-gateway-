export const detectCardNetwork = (cardNumber) => {
  if (!cardNumber) return "unknown";

  const digits = cardNumber.replace(/[\s-]/g, "");

  if (digits.startsWith("4")) return "visa";

  const firstTwo = parseInt(digits.slice(0, 2), 10);
  if (firstTwo >= 51 && firstTwo <= 55) return "mastercard";

  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";

  if (
    digits.startsWith("60") ||
    digits.startsWith("65") ||
    (firstTwo >= 81 && firstTwo <= 89)
  ) {
    return "rupay";
  }

  return "unknown";
};
