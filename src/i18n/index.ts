import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ru from "./locales/ru";
import zh from "./locales/zh";

export type SupportedLanguage = "en" | "ru" | "zh";

const DEFAULT_LANGUAGE: SupportedLanguage = "en";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    zh: { translation: zh },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});

export default i18n;
