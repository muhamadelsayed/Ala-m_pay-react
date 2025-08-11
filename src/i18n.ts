import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    // وضعنا ترجمات وهمية هنا
    resources: {
      en: {
        translation: {
          "PricingBundles": "Pricing Bundles",
          "PaymentMethod": "Payment Method",
          "ConfirmPayment": "Confirm Payment",
          // أضف أي مفاتيح ترجمة أخرى تحتاجها هنا
        }
      }
    },
    lng: "en", // اللغة الافتراضية
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;