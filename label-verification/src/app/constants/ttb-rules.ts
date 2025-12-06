// TTB Label Requirements and Validation Rules

export const PRODUCT_TYPES = {
  WINE: 'wine',
  BEER: 'beer',
  DISTILLED_SPIRITS: 'distilled_spirits',
} as const;

export type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES];

// Official TTB Health Warning Statement (27 CFR § 16.21)
export const HEALTH_WARNING_TEXT = 
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

// Alternative format (single line)
export const HEALTH_WARNING_TEXT_ALT = 
  "GOVERNMENT WARNING: According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

// Wine-specific rules
export const WINE_RULES = {
  tableWineMaxABV: 14.0,
  tableWineDescriptor: "Table Wine",
  requiresSulfiteDeclaration: true,
  sulfiteThreshold: 10, // ppm
  allowedDescriptors: [
    "Table Wine",
    "Light Wine",
    "Dessert Wine",
    "Sparkling Wine",
  ],
};

// Beer-specific rules
export const BEER_RULES = {
  requiresIngredientsList: false, // Optional but recommended
  commonStyles: [
    "IPA",
    "Pale Ale",
    "Lager",
    "Stout",
    "Porter",
    "Pilsner",
    "Wheat Beer",
    "Sour Beer",
  ],
};

// Distilled Spirits rules
export const DISTILLED_SPIRITS_RULES = {
  minimumABV: 20.0,
  classes: [
    "Whiskey",
    "Bourbon",
    "Rye Whiskey",
    "Tennessee Whiskey",
    "Scotch Whisky",
    "Vodka",
    "Gin",
    "Rum",
    "Tequila",
    "Brandy",
    "Cognac",
  ],
  bourbonRequirements: {
    minimumABV: 40.0,
    descriptor: "Kentucky Straight Bourbon Whiskey",
  },
};

// Product-specific field requirements
export const REQUIRED_FIELDS: Record<ProductType, string[]> = {
  [PRODUCT_TYPES.WINE]: [
    'brandName',
    'productType',
    'alcoholContent',
    'netContents',
    'sulfiteDeclaration',
  ],
  [PRODUCT_TYPES.BEER]: [
    'brandName',
    'productType',
    'alcoholContent',
    'netContents',
  ],
  [PRODUCT_TYPES.DISTILLED_SPIRITS]: [
    'brandName',
    'productType',
    'alcoholContent',
    'netContents',
  ],
};

// Validation helpers
export function validateWineABV(abv: number): {
  valid: boolean;
  message?: string;
  descriptor?: string;
} {
  if (abv <= WINE_RULES.tableWineMaxABV) {
    return {
      valid: true,
      descriptor: WINE_RULES.tableWineDescriptor,
      message: `This qualifies as "${WINE_RULES.tableWineDescriptor}" (ABV ≤ 14%)`,
    };
  }
  return {
    valid: true,
    descriptor: "Dessert Wine",
    message: "This qualifies as Dessert Wine or Fortified Wine (ABV > 14%)",
  };
}

export function validateDistilledSpiritsABV(abv: number): {
  valid: boolean;
  message?: string;
} {
  if (abv < DISTILLED_SPIRITS_RULES.minimumABV) {
    return {
      valid: false,
      message: `Distilled spirits must be at least ${DISTILLED_SPIRITS_RULES.minimumABV}% ABV`,
    };
  }
  return { valid: true };
}

export function normalizeWarningText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
    .toUpperCase();
}

export function validateHealthWarning(extractedText: string): {
  valid: boolean;
  message: string;
  issues?: string[];
} {
  const normalized = normalizeWarningText(extractedText);
  const expectedNormalized = normalizeWarningText(HEALTH_WARNING_TEXT);
  const expectedAltNormalized = normalizeWarningText(HEALTH_WARNING_TEXT_ALT);

  const issues: string[] = [];

  // Check if text contains key phrases
  if (!normalized.includes('GOVERNMENT WARNING')) {
    issues.push('Missing "GOVERNMENT WARNING" header');
  }

  if (!normalized.includes('SURGEON GENERAL')) {
    issues.push('Missing "Surgeon General" reference (proper capitalization required)');
  }

  if (!normalized.includes('PREGNANCY')) {
    issues.push('Missing pregnancy warning');
  }

  if (!normalized.includes('BIRTH DEFECTS')) {
    issues.push('Missing birth defects warning');
  }

  if (!normalized.includes('IMPAIRS YOUR ABILITY TO DRIVE')) {
    issues.push('Missing driving impairment warning');
  }

  // Check for exact match (allowing for formatting differences)
  const isExactMatch = 
    normalized === expectedNormalized || 
    normalized === expectedAltNormalized;

  if (issues.length === 0 && isExactMatch) {
    return {
      valid: true,
      message: 'Health warning meets TTB requirements',
    };
  }

  if (issues.length === 0 && !isExactMatch) {
    return {
      valid: false,
      message: 'Health warning contains required elements but wording may not be exact',
      issues: ['Verify exact wording matches TTB requirements'],
    };
  }

  return {
    valid: false,
    message: 'Health warning does not meet TTB requirements',
    issues,
  };
}
