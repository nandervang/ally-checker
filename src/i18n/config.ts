import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import svSE from "./locales/sv-SE.json";
import enUS from "./locales/en-US.json";

const resources = {
  "sv-SE": { translation: svSE },
  "en-US": { translation: enUS },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "sv-SE", // Swedish as default per requirements
    supportedLngs: ["sv-SE", "en-US"],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
