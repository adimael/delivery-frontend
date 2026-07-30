const BRAZIL_COUNTRY_CODE = "55";

export const normalizeBrazilWhatsAppNumber = (value?: string | null): string | null => {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length >= 11) {
    digits = digits.slice(1);
  }

  if (digits.length === 10 || digits.length === 11) {
    digits = `${BRAZIL_COUNTRY_CODE}${digits}`;
  }

  if (!/^55\d{10,11}$/.test(digits)) {
    return null;
  }

  return digits;
};

export const createWhatsAppConversationUrl = (
  phone?: string | null,
  message?: string,
): string | null => {
  const normalizedPhone = normalizeBrazilWhatsAppNumber(phone);
  if (!normalizedPhone) return null;

  const params = new URLSearchParams({
    phone: normalizedPhone,
    type: "phone_number",
    app_absent: "0",
  });

  if (message?.trim()) {
    params.set("text", message.trim());
  }

  return `https://api.whatsapp.com/send?${params.toString()}`;
};
