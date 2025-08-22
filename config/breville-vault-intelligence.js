// config/breville-vault-intelligence.js
// Based on official Breville Brandfolder documentation

export const BREVILLE_PRODUCTS = {
  // Coffee Products
  "BES985": {
    name: "Oracle Jet",
    sageModel: "SES985",
    category: "Coffee",
    subCategory: "Automatic Espresso Machines",
    portfolio: "Coffee",
    regions: ["AU", "US", "CA", "GB", "DE"],
    aliases: ["oracle jet", "jet"]
  },
  "BES995": {
    name: "Oracle Dual Boiler", 
    sageModel: "SES995",
    category: "Coffee",
    subCategory: "Espresso Machines",
    portfolio: "Coffee",
    regions: ["AU", "US", "CA", "GB", "DE"],
    aliases: ["oracle dual boiler", "dual boiler", "oracle dual"]
  },
  "BES990": {
    name: "Oracle Touch",
    sageModel: "SES990", 
    category: "Coffee",
    subCategory: "Automatic Espresso Machines",
    portfolio: "Coffee",
    regions: ["AU", "US", "CA", "GB", "DE"],
    aliases: ["oracle touch", "touch"]
  }
  // Add more products as needed
};

export const ASSET_SECTIONS = {
  "product_photography": {
    section: "Product Photography",
    description: "Hero images for web product pages and detail pages",
    keywords: ["product photo", "hero image", "product shot", "product image"],
    deliverables: ["Low Res Product Photography", "Spare Parts Photography"],
    useCases: ["web", "ecommerce", "product pages"]
  },
  "lifestyle_photography": {
    section: "Lifestyle Photography",
    description: "Products in kitchen environment with food and coffee",
    keywords: ["lifestyle", "kitchen", "in use", "environment", "lifestyle photo"],
    deliverables: ["Lifestyle Photography"],
    useCases: ["marketing", "social", "web", "advertising"]
  },
  "digital_assets": {
    section: "Digital Assets (incl. Websites, Programmatic & EDM)",
    description: "Online assets including PDP, CLP, FLP, web banners, icons, 3D models",
    keywords: ["web banner", "icon", "3d model", "programmatic", "edm", "digital"],
    deliverables: [
      "3D Model", "Amazon A+", "Amazon Infographics", "Colour Swatches",
      "EDM", "GIF", "Icon", "Key Visual", "PDP", "PLP", "Web Banners and Static Banners",
      "Website / App", "Programmatic Ads"
    ],
    useCases: ["web", "digital", "online", "ecommerce"]
  },
  "social_media": {
    section: "Social (incl. Videos, Statics, Stories & Keynotes)",
    description: "Social media assets for paid and organic content",
    keywords: ["social", "instagram", "facebook", "social media", "stories"],
    deliverables: [
      "Instagram / Facebook - Campaign", "Instagram / Facebook - NPD",
      "Organic Social Assets", "Paid Social Assets", "Social Advertising",
      "Social Photography", "Social Video cutdowns"
    ],
    useCases: ["social", "instagram", "facebook", "marketing"]
  },
  "point_of_sale": {
    section: "Point of Sales (POS)", 
    description: "In-store retail materials including banners, cards, displays",
    keywords: ["pos", "retail", "in-store", "banner", "display", "counter card"],
    deliverables: [
      "T4 Horizontal", "T4 Vertical", "Hanging Banner", "Counter Card",
      "Banner POS", "Brochure", "Catalogue", "Display Fixture", "Posters"
    ],
    useCases: ["retail", "in-store", "pos", "display"]
  },
  "youtube_videos": {
    section: "YouTube Videos",
    description: "Video content including tutorials, demos, and promotional videos", 
    keywords: ["video", "youtube", "tutorial", "demonstration", "how to"],
    deliverables: [
      "Product Demonstration Video", "Tutorial/How to videos", "Care and Maintenance Video",
      "Training Video", "TVC", "Youtube Thumbnails"
    ],
    useCases: ["youtube", "video", "training", "tutorial"]
  },
  "logos": {
    section: "Logos",
    description: "Brand logos and partner logos",
    keywords: ["logo", "brand", "breville logo", "sage logo"],
    deliverables: ["Brands & Logos", "Partner Logos"],
    useCases: ["branding", "presentations", "web", "print"]
  }
};

export const REGIONAL_MAPPING = {
  "AU": { brand: "Breville", theater: "APAC" },
  "US": { brand: "Breville", theater: "USCM" },
  "CA": { brand: "Breville", theater: "USCM" },
  "GB": { brand: "Sage", theater: "EMEA" },
  "UK": { brand: "Sage", theater: "EMEA" },
  "DE": { brand: "Sage", theater: "EMEA" },
  "EU": { brand: "Sage", theater: "EMEA" }
};

export const USE_CASE_OPTIMIZATION = {
  "presentation": {
    preferredFormats: ["PNG", "SVG"],
    notes: ["Transparent backgrounds ideal", "High resolution for projectors"],
    sections: ["logos", "product_photography", "digital_assets"]
  },
  "web": {
    preferredFormats: ["PNG", "WebP", "SVG"],
    notes: ["Optimized file sizes", "Responsive design ready"],
    sections: ["digital_assets", "product_photography", "logos"]
  },
  "social": {
    preferredFormats: ["PNG", "JPG", "MP4"],
    notes: ["Platform-specific dimensions", "Engaging compositions"],
    sections: ["social_media", "lifestyle_photography"]
  },
  "retail": {
    preferredFormats: ["PDF", "EPS", "PNG"],
    notes: ["High resolution for print", "CMYK color space"],
    sections: ["point_of_sale", "logos", "product_photography"]
  },
  "amazon": {
    preferredFormats: ["JPG", "PNG"],
    notes: ["Amazon-specific requirements", "A+ content optimized"],
    sections: ["digital_assets", "product_photography"],
    specificDeliverables: ["Amazon A+", "Amazon Infographics"]
  }
};

// Smart product detection function
export function findProduct(searchTerm) {
  const term = searchTerm.toLowerCase();
  
  // Direct model number match
  for (const [modelNumber, product] of Object.entries(BREVILLE_PRODUCTS)) {
    if (term.includes(modelNumber.toLowerCase())) {
      return { ...product, modelNumber };
    }
  }
  
  // Alias matching
  for (const [modelNumber, product] of Object.entries(BREVILLE_PRODUCTS)) {
    for (const alias of product.aliases) {
      if (term.includes(alias.toLowerCase())) {
        return { ...product, modelNumber };
      }
    }
  }
  
  return null;
}

// Smart section detection
export function findBestSections(searchTerm, useCase = null) {
  const term = searchTerm.toLowerCase();
  const matches = [];
  
  for (const [sectionKey, section] of Object.entries(ASSET_SECTIONS)) {
    let score = 0;
    
    // Keyword matching
    for (const keyword of section.keywords) {
      if (term.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    // Use case alignment
    if (useCase && section.useCases.includes(useCase)) {
      score += 3;
    }
    
    if (score > 0) {
      matches.push({ sectionKey, section, score });
    }
  }
  
  return matches.sort((a, b) => b.score - a.score);
}
