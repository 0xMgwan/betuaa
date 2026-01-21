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
    },
    createMarket: {
      title: "Create Prediction Market",
      category: "Category",
      marketQuestion: "Market Question",
      description: "Description",
      closingDate: "Closing Date",
      paymentToken: "Payment Token",
      questionPlaceholder: "Will Bitcoin reach $150,000 by end of 2026?",
      descriptionPlaceholder: "Provide details about the market resolution criteria...",
      fillField: "Please fill out this field."
    },
    activity: {
      recentActivity: "Recent Activity",
      createdMarket: "created market",
      marketResolved: "Market resolved:",
      won: "won",
      about: "about",
      hourAgo: "hour ago",
      hoursAgo: "hours ago",
      minuteAgo: "minute ago",
      minutesAgo: "minutes ago",
      dayAgo: "day ago",
      daysAgo: "days ago",
      monthAgo: "month ago",
      monthsAgo: "months ago"
    },
    profile: {
      joined: "Joined",
      rank: "Rank",
      followers: "followers",
      following: "following",
      totalVolume: "Total Volume",
      totalProfit: "Total Profit",
      winRate: "Win Rate",
      totalTrades: "Total Trades",
      activePositions: "Active Positions",
      activity: "Activity",
      createdMarkets: "Created Markets",
      noActivePositions: "No active positions"
    },
    portfolio: {
      title: "Portfolio",
      trackPositions: "Track your positions and performance",
      myPositions: "My Positions",
      favorites: "Favorites",
      activity: "Activity",
      totalValue: "Total Value",
      unrealizedPL: "Unrealized P&L",
      activePositions: "Active Positions",
      claimable: "claimable",
      yourPositions: "Your Positions",
      currentPrice: "Current Price",
      currentValue: "Current Value",
      shares: "shares",
      claimWinnings: "Claim Winnings",
      marketResolved: "Market Resolved - No Winnings"
    },
    footer: {
      allRights: "All rights reserved",
      privacy: "Privacy",
      terms: "Terms of Use",
      learn: "Learn",
      careers: "Careers",
      press: "Press"
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
    },
    createMarket: {
      title: "Unda Soko la Utabiri",
      category: "Jamii",
      marketQuestion: "Swali la Soko",
      description: "Maelezo",
      closingDate: "Tarehe ya Kufunga",
      paymentToken: "Tokeni ya Malipo",
      questionPlaceholder: "Je, Bitcoin itafikia $150,000 mwishoni mwa 2026?",
      descriptionPlaceholder: "Toa maelezo kuhusu vigezo vya utatuzi wa soko...",
      fillField: "Tafadhali jaza sehemu hii."
    },
    activity: {
      recentActivity: "Shughuli za Hivi Karibuni",
      createdMarket: "imeunda soko",
      marketResolved: "Soko limetatuliwa:",
      won: "imeshinda",
      about: "karibu",
      hourAgo: "saa 1 iliyopita",
      hoursAgo: "masaa iliyopita",
      minuteAgo: "dakika 1 iliyopita",
      minutesAgo: "dakika iliyopita",
      dayAgo: "siku 1 iliyopita",
      daysAgo: "siku iliyopita",
      monthAgo: "mwezi 1 uliopita",
      monthsAgo: "miezi iliyopita"
    },
    profile: {
      joined: "Alijiunga",
      rank: "Nafasi",
      followers: "wafuasi",
      following: "inafuata",
      totalVolume: "Jumla ya Kiasi",
      totalProfit: "Jumla ya Faida",
      winRate: "Kiwango cha Ushindi",
      totalTrades: "Jumla ya Biashara",
      activePositions: "Nafasi Hai",
      activity: "Shughuli",
      createdMarkets: "Masoko Yaliyoundwa",
      noActivePositions: "Hakuna nafasi hai"
    },
    portfolio: {
      title: "Mkoba",
      trackPositions: "Fuatilia nafasi na utendaji wako",
      myPositions: "Nafasi Zangu",
      favorites: "Vipendwa",
      activity: "Shughuli",
      totalValue: "Thamani Jumla",
      unrealizedPL: "Faida/Hasara Isiyotambuliwa",
      activePositions: "Nafasi Hai",
      claimable: "inaweza kudaiwa",
      yourPositions: "Nafasi Zako",
      currentPrice: "Bei ya Sasa",
      currentValue: "Thamani ya Sasa",
      shares: "hisa",
      claimWinnings: "Dai Ushindi",
      marketResolved: "Soko Limetatuliwa - Hakuna Ushindi"
    },
    footer: {
      allRights: "Haki zote zimehifadhiwa",
      privacy: "Faragha",
      terms: "Masharti ya Matumizi",
      learn: "Jifunze",
      careers: "Kazi",
      press: "Habari"
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
