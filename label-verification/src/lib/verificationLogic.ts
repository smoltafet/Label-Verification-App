import { HEALTH_WARNING_TEXT } from '../app/constants/ttb-rules';

export interface VerificationResult {
  field: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  labelText?: string;
  formText?: string;
  confidence?: number;
}

export interface VerificationReport {
  overallStatus: 'approved' | 'rejected' | 'needs-review';
  results: VerificationResult[];
  detectedText: string;
}

export function verifyLabel(formData: any, ocrText: string): VerificationReport {
  const results: VerificationResult[] = [];
  
  // 1. Brand Name Check
  results.push(verifyBrandName(formData.brandName, ocrText));
  
  // 2. Product Type Check
  results.push(verifyProductType(formData.productType, ocrText));
  
  // 3. Alcohol Content Check
  results.push(verifyAlcoholContent(formData.alcoholContent, ocrText));
  
  // 4. Net Contents Check (if provided)
  if (formData.netContents) {
    results.push(verifyNetContents(formData.netContents, ocrText));
  }
  
  // 5. Health Warning Check
  results.push(verifyHealthWarning(ocrText));
  
  // 6. Category-specific checks
  if (formData.productCategory === 'wine' && formData.sulfiteDeclaration) {
    results.push(verifySulfites(formData.sulfiteDeclaration, ocrText));
  }
  
  if (formData.productCategory === 'distilled_spirits' && formData.ageStatement) {
    results.push(verifyAgeStatement(formData.ageStatement, ocrText));
  }
  
  // Determine overall status
  const failures = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  let overallStatus: 'approved' | 'rejected' | 'needs-review';
  if (failures === 0 && warnings === 0) {
    overallStatus = 'approved';
  } else if (failures > 0) {
    overallStatus = 'rejected';
  } else {
    overallStatus = 'needs-review';
  }
  
  return { overallStatus, results, detectedText: ocrText };
}

function verifyBrandName(brandName: string, ocrText: string): VerificationResult {
  const normalized = ocrText.toLowerCase();
  const brand = brandName.toLowerCase();
  
  if (normalized.includes(brand)) {
    return {
      field: 'Brand Name',
      status: 'pass',
      message: 'Brand name found on label',
      formText: brandName,
      labelText: brandName,
      confidence: 100
    };
  }
  
  // Check for partial match
  const words = brand.split(' ');
  const matchedWords = words.filter(word => word.length > 3 && normalized.includes(word));
  
  if (matchedWords.length > 0 && matchedWords.length >= words.length / 2) {
    return {
      field: 'Brand Name',
      status: 'warning',
      message: `Partial brand match found (${matchedWords.length}/${words.length} words)`,
      formText: brandName,
      confidence: (matchedWords.length / words.length) * 100
    };
  }
  
  return {
    field: 'Brand Name',
    status: 'fail',
    message: `Brand name "${brandName}" not found on label`,
    formText: brandName,
    confidence: 0
  };
}

function verifyProductType(productType: string, ocrText: string): VerificationResult {
  const normalized = ocrText.toLowerCase();
  const type = productType.toLowerCase();
  
  if (normalized.includes(type)) {
    return {
      field: 'Product Type',
      status: 'pass',
      message: 'Product type found on label',
      formText: productType,
      confidence: 90
    };
  }
  
  // Check for partial match
  const typeWords = type.split(' ');
  const matchedWords = typeWords.filter(word => word.length > 3 && normalized.includes(word));
  
  if (matchedWords.length > 0) {
    return {
      field: 'Product Type',
      status: 'warning',
      message: `Product type partially found on label`,
      formText: productType,
      confidence: 60
    };
  }
  
  return {
    field: 'Product Type',
    status: 'warning',
    message: `Product type "${productType}" not explicitly found`,
    formText: productType,
    confidence: 50
  };
}

function verifyAlcoholContent(abv: string, ocrText: string): VerificationResult {
  const abvPattern = /(\d+\.?\d*)\s*%/g;
  const matches = [...ocrText.matchAll(abvPattern)];
  const formValue = parseFloat(abv);
  
  for (const match of matches) {
    const detected = parseFloat(match[1]);
    if (Math.abs(detected - formValue) < 0.5) {
      return {
        field: 'Alcohol Content',
        status: 'pass',
        message: `ABV ${detected}% matches form data`,
        formText: `${abv}%`,
        labelText: `${detected}%`,
        confidence: 95
      };
    }
  }
  
  // Check if any ABV was found
  if (matches.length > 0) {
    const closest = matches.reduce((prev, curr) => {
      const prevDiff = Math.abs(parseFloat(prev[1]) - formValue);
      const currDiff = Math.abs(parseFloat(curr[1]) - formValue);
      return currDiff < prevDiff ? curr : prev;
    });
    
    return {
      field: 'Alcohol Content',
      status: 'fail',
      message: `ABV mismatch: Form shows ${abv}%, label shows ${closest[1]}%`,
      formText: `${abv}%`,
      labelText: `${closest[1]}%`,
      confidence: 30
    };
  }
  
  return {
    field: 'Alcohol Content',
    status: 'fail',
    message: `Could not find any ABV percentage on label`,
    formText: `${abv}%`,
    confidence: 0
  };
}

function verifyNetContents(netContents: string, ocrText: string): VerificationResult {
  const volumePattern = /(\d+\.?\d*)\s*(mL|ml|oz|OZ|L|l|fl\s*oz)/gi;
  const matches = [...ocrText.matchAll(volumePattern)];
  
  const normalizedInput = netContents.toLowerCase().replace(/\s+/g, '');
  
  for (const match of matches) {
    const detected = `${match[1]}${match[2]}`.toLowerCase().replace(/\s+/g, '');
    
    if (normalizedInput.includes(detected) || detected.includes(normalizedInput.replace('floz', 'oz'))) {
      return {
        field: 'Net Contents',
        status: 'pass',
        message: 'Volume matches label',
        formText: netContents,
        labelText: match[0],
        confidence: 90
      };
    }
  }
  
  return {
    field: 'Net Contents',
    status: 'warning',
    message: 'Could not verify volume on label',
    formText: netContents,
    confidence: 0
  };
}

function verifyHealthWarning(ocrText: string): VerificationResult {
  const normalized = ocrText.toUpperCase();
  
  const requiredPhrases = [
    'GOVERNMENT WARNING',
    'SURGEON GENERAL',
    'PREGNANCY',
    'BIRTH DEFECTS',
    'IMPAIRS YOUR ABILITY TO DRIVE'
  ];
  
  let matchCount = 0;
  const foundPhrases: string[] = [];
  const missingPhrases: string[] = [];
  
  for (const phrase of requiredPhrases) {
    if (normalized.includes(phrase)) {
      matchCount++;
      foundPhrases.push(phrase);
    } else {
      missingPhrases.push(phrase);
    }
  }
  
  const confidence = (matchCount / requiredPhrases.length) * 100;
  
  if (matchCount >= 4) {
    return {
      field: 'Health Warning',
      status: 'pass',
      message: `Required health warning present (${matchCount}/5 key phrases found)`,
      confidence
    };
  } else if (matchCount >= 2) {
    return {
      field: 'Health Warning',
      status: 'warning',
      message: `Partial health warning found (${matchCount}/5 phrases). Missing: ${missingPhrases.join(', ')}`,
      confidence
    };
  }
  
  return {
    field: 'Health Warning',
    status: 'fail',
    message: 'Required health warning missing or incomplete',
    confidence
  };
}

function verifySulfites(declaration: string, ocrText: string): VerificationResult {
  const normalized = ocrText.toLowerCase();
  
  if (normalized.includes('sulfite') || normalized.includes('sulphite')) {
    return {
      field: 'Sulfite Declaration (Wine)',
      status: 'pass',
      message: 'Sulfite declaration found on label',
      formText: declaration,
      confidence: 95
    };
  }
  
  return {
    field: 'Sulfite Declaration (Wine)',
    status: 'fail',
    message: 'Required sulfite declaration missing from label',
    formText: declaration,
    confidence: 0
  };
}

function verifyAgeStatement(ageStatement: string, ocrText: string): VerificationResult {
  const normalized = ocrText.toLowerCase();
  const statement = ageStatement.toLowerCase();
  
  // Extract number from age statement
  const ageMatch = statement.match(/(\d+)\s*(year|yr)/);
  
  if (ageMatch && normalized.includes(ageMatch[1])) {
    return {
      field: 'Age Statement',
      status: 'pass',
      message: 'Age statement verified on label',
      formText: ageStatement,
      confidence: 85
    };
  }
  
  if (normalized.includes('age')) {
    return {
      field: 'Age Statement',
      status: 'warning',
      message: 'Age statement found but could not verify exact match',
      formText: ageStatement,
      confidence: 60
    };
  }
  
  return {
    field: 'Age Statement',
    status: 'warning',
    message: 'Age statement not found on label',
    formText: ageStatement,
    confidence: 0
  };
}
