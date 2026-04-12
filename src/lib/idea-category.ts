/**
 * Heuristic "vertical" for an idea — used for Unsplash queries, prompts, and UI.
 * Order matters: first matching rule wins (more specific patterns first).
 */

export type IdeaCategoryId =
  | "ai_ml"
  | "saas_b2b"
  | "developer_tools"
  | "fintech"
  | "health_wellness"
  | "education"
  | "ecommerce"
  | "marketplace"
  | "hardware_iot"
  | "climate"
  | "gaming"
  | "media_creative"
  | "social_community"
  | "travel_hospitality"
  | "food_beverage"
  | "real_estate"
  | "logistics"
  | "professional_services"
  | "agriculture"
  | "consumer_app"
  | "default";

export interface IdeaCategory {
  id: IdeaCategoryId;
  /** Short label for UI chips */
  label: string;
  /** Phrase blended into Unsplash search (concrete, visual) */
  searchBoost: string;
}

const RULES: {
  id: IdeaCategoryId;
  label: string;
  searchBoost: string;
  test: RegExp;
}[] = [
  {
    id: "ai_ml",
    label: "AI & machine learning",
    searchBoost: "artificial intelligence technology abstract",
    test: /\b(ai|ml\b|m\.l\.|llm|gpt|chatbot|neural|deep learning|machine learning|generative|computer vision|nlp|model training|fine-?tun|embedding)\b/i,
  },
  {
    id: "developer_tools",
    label: "Developer tools",
    searchBoost: "software developer coding laptop",
    test: /\b(devops|sdk|api\b|github|ci\/cd|compiler|ide\b|infra|kubernetes|observability|developer tool|code review|lint)\b/i,
  },
  {
    id: "saas_b2b",
    label: "B2B / SaaS",
    searchBoost: "business team dashboard office",
    test: /\b(b2b|saas|enterprise|workflow|crm|erp|sales team|revenue ops|procurement|vendor|subscription software)\b/i,
  },
  {
    id: "fintech",
    label: "Fintech & payments",
    searchBoost: "fintech banking digital payment",
    test: /\b(fintech|payment|banking|defi|crypto|wallet|lend|loan|credit|insur|trading|ledger|invoice|bnpl)\b/i,
  },
  {
    id: "health_wellness",
    label: "Health & wellness",
    searchBoost: "healthcare medical wellness fitness",
    test: /\b(health|medical|wellness|fitness|clinic|patient|therapy|telehealth|pharma|biotech|mental health|nutrition|wearable)\b/i,
  },
  {
    id: "education",
    label: "Education",
    searchBoost: "education learning students classroom",
    test: /\b(education|edtech|learning|course|tutor|school|university|curriculum|teaching|student|lms|certification)\b/i,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    searchBoost: "marketplace ecommerce handshake",
    test: /\b(marketplace|two-?sided|buyers and sellers|supply and demand|liquidity|gmv|take rate)\b/i,
  },
  {
    id: "ecommerce",
    label: "E‑commerce & retail",
    searchBoost: "ecommerce shopping retail brand",
    test: /\b(e-?commerce|ecommerce|d2c|dtc|retail|shopify|storefront|dropship|inventory|sku|merchant)\b/i,
  },
  {
    id: "hardware_iot",
    label: "Hardware & IoT",
    searchBoost: "hardware electronics device manufacturing",
    test: /\b(hardware|iot|sensor|robot|device|oem|manufactur|pcb|firmware|wearable device|drone)\b/i,
  },
  {
    id: "climate",
    label: "Climate & sustainability",
    searchBoost: "sustainability renewable energy nature tech",
    test: /\b(climate|carbon|solar|renewable|esg|cleantech|recycl|battery|ev\b|emission)\b/i,
  },
  {
    id: "gaming",
    label: "Gaming",
    searchBoost: "video games gaming esports",
    test: /\b(game|gaming|gamer|esports|unity|unreal|mmorpg|mobile game)\b/i,
  },
  {
    id: "media_creative",
    label: "Media & creative",
    searchBoost: "creative design studio photography",
    test: /\b(design|creative|video|podcast|streaming|content creator|photo|music|media company|production)\b/i,
  },
  {
    id: "social_community",
    label: "Social & community",
    searchBoost: "social network community people",
    test: /\b(social network|community|forum|messaging app|dating|followers|creator economy|membership site)\b/i,
  },
  {
    id: "travel_hospitality",
    label: "Travel & hospitality",
    searchBoost: "travel hotel tourism adventure",
    test: /\b(travel|hotel|tourism|booking|flight|hospitality|hostel|vacation)\b/i,
  },
  {
    id: "food_beverage",
    label: "Food & beverage",
    searchBoost: "food restaurant cooking kitchen",
    test: /\b(food|restaurant|recipe|meal|kitchen|chef|grocery|beverage|coffee|brewery)\b/i,
  },
  {
    id: "real_estate",
    label: "Real estate",
    searchBoost: "real estate architecture city building",
    test: /\b(real estate|property|housing|mortgage|landlord|proptech|rental)\b/i,
  },
  {
    id: "logistics",
    label: "Logistics & mobility",
    searchBoost: "logistics shipping warehouse transport",
    test: /\b(logistics|supply chain|warehouse|fulfillment|freight|fleet|delivery|last mile|mobility)\b/i,
  },
  {
    id: "professional_services",
    label: "Professional services",
    searchBoost: "business consulting office meeting",
    test: /\b(consulting|legal tech|accounting|agency|recruiting|hr tech|contract|compliance)\b/i,
  },
  {
    id: "agriculture",
    label: "Agriculture & food systems",
    searchBoost: "agriculture farming crops technology",
    test: /\b(agri|farm|crop|livestock|agtech|vertical farm)\b/i,
  },
  {
    id: "consumer_app",
    label: "Consumer app",
    searchBoost: "smartphone app lifestyle mobile",
    test: /\b(consumer app|mobile app|iphone|android app|lifestyle app)\b/i,
  },
];

const DEFAULT: IdeaCategory = {
  id: "default",
  label: "Business & technology",
  searchBoost: "startup technology business modern",
};

/**
 * Classify an idea from topic + optional pitch for imagery, prompts, and UI.
 */
export function classifyIdeaCategory(topic: string, position?: string): IdeaCategory {
  const text = `${topic || ""} ${position ?? ""}`.trim();
  if (text.length < 2) return DEFAULT;
  for (const rule of RULES) {
    if (rule.test.test(text)) {
      return { id: rule.id, label: rule.label, searchBoost: rule.searchBoost };
    }
  }
  return DEFAULT;
}
