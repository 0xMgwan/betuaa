import { useLanguage } from '@/contexts/LanguageContext';

const translations = {
  en: {
    nav: {
      markets: "Markets",
      ideas: "Ideas",
      createMarket: "Create Market",
      search: "Search markets or profiles",
      profile: "Profile",
      portfolio: "Portfolio",
      stats: "Stats",
      leaderboard: "Leaderboard",
      disconnect: "Disconnect",
      language: "Language"
    },
    categories: {
      trending: "Trending",
      new: "New",
      all: "All",
      sports: "Sports",
      crypto: "Crypto",
      politics: "Politics",
      business: "Business",
      tech: "Tech",
      climate: "Climate"
    },
    market: {
      liveMarkets: "Live Markets",
      volume: "Volume",
      yes: "Yes",
      no: "No"
    }
  },
  sw: {
    nav: {
      markets: "Masoko",
      ideas: "Mawazo",
      createMarket: "Unda Soko",
      search: "Tafuta masoko au wasifu",
      profile: "Wasifu",
      portfolio: "Mkoba",
      stats: "Takwimu",
      leaderboard: "Ubao wa Viongozi",
      disconnect: "Ondoa Muunganisho",
      language: "Lugha"
    },
    categories: {
      trending: "Maarufu",
      new: "Mpya",
      all: "Yote",
      sports: "Michezo",
      crypto: "Sarafu za Kidijitali",
      politics: "Siasa",
      business: "Biashara",
      tech: "Teknolojia",
      climate: "Hali ya Hewa"
    },
    market: {
      liveMarkets: "Masoko ya Moja kwa Moja",
      volume: "Kiasi",
      yes: "Ndiyo",
      no: "Hapana"
    }
  }
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Replace parameters like {token} with actual values
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, paramValue),
        value
      );
    }

    return value;
  };

  return { t, language };
}
