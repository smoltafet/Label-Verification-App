'use client';

import { useState, FormEvent } from 'react';
import ImageUpload from '@/components/forms/ImageUpload';
import StatusBanner from '@/components/shared/StatusBanner';
import { ProductCategoryDropdown } from '@/components/ui/fluid-dropdown';
import VerificationResultsPanel from './VerificationResultsPanel';
import { uploadAndExtractText } from '@/services/uploadService';
import { verifyLabel, VerificationReport } from '@/services/verificationLogic';
import { useAuth } from '@/features/auth/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import {
  PRODUCT_TYPES,
  ProductType,
  validateWineABV,
  validateDistilledSpiritsABV,
  WINE_RULES,
  BEER_RULES,
  DISTILLED_SPIRITS_RULES,
  HEALTH_WARNING_TEXT,
} from '@/app/constants/ttb-rules';

interface FormData {
  productCategory: ProductType | '';
  brandName: string;
  productType: string;
  alcoholContent: string;
  netContents: string;
  // Wine-specific
  sulfiteDeclaration: string;
  // Beer-specific
  ingredients: string;
  // Distilled Spirits-specific
  ageStatement: string;
  distillerName: string;
  // Health Warning
  healthWarning: string;
}

export default function VerificationForm() {
  const { user, userProfile } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    productCategory: '',
    brandName: '',
    productType: '',
    alcoholContent: '',
    netContents: '',
    sulfiteDeclaration: '',
    ingredients: '',
    ageStatement: '',
    distillerName: '',
    healthWarning: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [validationInfo, setValidationInfo] = useState<string[]>([]);
  const [verificationResults, setVerificationResults] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Track if form has been submitted

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time ABV validation
    if (name === 'alcoholContent' && value && formData.productCategory) {
      const abv = parseFloat(value);
      if (!isNaN(abv)) {
        const info: string[] = [];
        
        if (formData.productCategory === PRODUCT_TYPES.WINE) {
          const wineValidation = validateWineABV(abv);
          if (wineValidation.message) {
            info.push(wineValidation.message);
          }
        } else if (formData.productCategory === PRODUCT_TYPES.DISTILLED_SPIRITS) {
          const spiritsValidation = validateDistilledSpiritsABV(abv);
          if (!spiritsValidation.valid && spiritsValidation.message) {
            info.push(`⚠️ ${spiritsValidation.message}`);
          }
        }
        
        setValidationInfo(info);
      }
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData({
      ...formData,
      productCategory: categoryId as ProductType,
      productType: '', // Reset product type when category changes
    });
    setValidationInfo([]);
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // Must have an image
    if (!selectedImage) return false;
    
    // Must have product category
    if (!formData.productCategory) return false;
    
    // Common required fields for all categories
    if (!formData.brandName.trim()) return false;
    if (!formData.productType.trim()) return false;
    if (!formData.alcoholContent.trim()) return false;
    if (!formData.netContents.trim()) return false;
    if (!formData.healthWarning.trim()) return false;
    
    // Category-specific required fields
    if (formData.productCategory === PRODUCT_TYPES.WINE) {
      if (!formData.sulfiteDeclaration.trim()) return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    // Skip all validation - just proceed if we have an image
    if (!selectedImage) {
      return; // Silently return if no image
    }

    if (!user) {
      return; // Silently return if not logged in
    }

    // Start Firebase OCR and verification
    setLoading(true);
    setStatus({ type: null, message: '' });
    setVerificationResults(null);

    try {
      // 1. Upload image and wait for Firebase Extension OCR
      let extractedText = '';
      try {
        extractedText = await uploadAndExtractText(selectedImage);
      } catch (error: any) {
        if (error.message === 'NO_TEXT_DETECTED') {
          throw new Error('No text detected on the uploaded image. Please upload a label with visible text.');
        }
        throw error;
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not read text from the label image. Please try a clearer image.');
      }
      
      // 2. Verify label against form data
      const results = verifyLabel(formData, extractedText);
      
      // 3. Display results
      setVerificationResults(results);

      // 4. Calculate score
      const passedChecks = results.results.filter(c => c.status === 'pass').length;
      const totalChecks = results.results.length;
      const score = Math.round((passedChecks / totalChecks) * 100);

      // 5. Determine overall status
      const overallStatus = results.overallStatus === 'approved' ? 'Approved' : 
                           results.overallStatus === 'rejected' ? 'Rejected' : 'Pending';

      // 6. Save submission to Firestore under user's subcollection
      console.log('💾 Attempting to save submission to Firestore...');
      console.log('User ID:', user.uid);
      console.log('User Profile:', userProfile);
      
      try {
        const submissionData = {
          userName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Unknown',
          brandName: formData.brandName,
          productType: formData.productType,
          productCategory: formData.productCategory,
          alcoholContent: formData.alcoholContent,
          netContents: formData.netContents,
          sulfiteDeclaration: formData.sulfiteDeclaration || null,
          ingredients: formData.ingredients || null,
          ageStatement: formData.ageStatement || null,
          distillerName: formData.distillerName || null,
          healthWarning: formData.healthWarning || null,
          extractedText: extractedText,
          verificationScore: score,
          status: overallStatus,
          results: results.results,
          submittedAt: serverTimestamp(),
          imageUrl: null,
        };
        
        console.log('📝 Submission data:', submissionData);
        
        // Save to: users/{userId}/submissions/{submissionId}
        const userSubmissionsRef = collection(firestore, 'users', user.uid, 'submissions');
        const docRef = await addDoc(userSubmissionsRef, submissionData);
        
        console.log('✅ Submission saved to users/' + user.uid + '/submissions/' + docRef.id);
      } catch (firestoreError: any) {
        console.error('❌ Firestore save error:', firestoreError);
        console.error('Error code:', firestoreError.code);
        console.error('Error message:', firestoreError.message);
        throw new Error(`Failed to save submission: ${firestoreError.message}`);
      }
      
      if (results.overallStatus === 'approved') {
        setStatus({
          type: 'success',
          message: '✅ Label verification complete! All checks passed. Submission saved successfully.'
        });
      } else if (results.overallStatus === 'rejected') {
        setStatus({
          type: 'error',
          message: '⚠️ Label verification failed. Please review issues below. Submission saved for review.'
        });
      } else {
        setStatus({
          type: 'error',
          message: '⚠️ Label requires manual review. Some issues detected. Submission saved.'
        });
      }
      
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Verification failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Only show success messages */}
      {status.type === 'success' && status.message && (
        <StatusBanner
          type={status.type}
          message={status.message}
          onClose={() => {
            setStatus({ type: null, message: '' });
            setHasSubmitted(false);
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#212529] mb-2">
            Submit Label for Verification
          </h2>
          <p className="text-sm text-[#6c757d]">
            Please provide the product information and upload the label image for TTB compliance review.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Product Category Selection - Fluid Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-[#212529] mb-3">
                  Select Product Category <span className="text-[#d9534f]">*</span>
                </label>
                <ProductCategoryDropdown
                  value={formData.productCategory}
                  onChange={handleCategoryChange}
                />
              </div>

              {formData.productCategory && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Brand Name */}
                  <div className="animate-slideIn">
                    <label
                      htmlFor="brandName"
                      className="block text-sm font-medium text-[#212529] mb-2"
                    >
                      Brand Name <span className="text-[#d9534f]">*</span>
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleInputChange}
                      placeholder="e.g., Old Tom Distillery"
                      className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Product Class/Type - with category-specific help text */}
                  <div className="animate-slideIn animate-delay-100">
                    <label
                      htmlFor="productType"
                      className="block text-sm font-medium text-[#212529] mb-2"
                    >
                      Product Class/Type <span className="text-[#d9534f]">*</span>
                    </label>
                    <input
                      type="text"
                      id="productType"
                      name="productType"
                      value={formData.productType}
                      onChange={handleInputChange}
                      placeholder={
                        formData.productCategory === PRODUCT_TYPES.WINE
                          ? 'e.g., Table Wine, Dessert Wine, Sparkling Wine'
                          : formData.productCategory === PRODUCT_TYPES.BEER
                          ? 'e.g., IPA, Lager, Stout'
                          : 'e.g., Kentucky Straight Bourbon Whiskey, Vodka, Gin'
                      }
                      className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all"
                      required
                    />
                    <p className="mt-1.5 text-xs text-[#6c757d]">
                      {formData.productCategory === PRODUCT_TYPES.WINE && (
                        <>Common: {WINE_RULES.allowedDescriptors.join(', ')}</>
                      )}
                      {formData.productCategory === PRODUCT_TYPES.BEER && (
                        <>Common styles: {BEER_RULES.commonStyles.slice(0, 4).join(', ')}, etc.</>
                      )}
                      {formData.productCategory === PRODUCT_TYPES.DISTILLED_SPIRITS && (
                        <>Classes: {DISTILLED_SPIRITS_RULES.classes.slice(0, 5).join(', ')}, etc.</>
                      )}
                    </p>
                  </div>

                  {/* Alcohol Content */}
                  <div className="animate-slideIn animate-delay-200">
                    <label
                      htmlFor="alcoholContent"
                      className="block text-sm font-medium text-[#212529] mb-2"
                    >
                      Alcohol Content (ABV) <span className="text-[#d9534f]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="alcoholContent"
                        name="alcoholContent"
                        value={formData.alcoholContent}
                        onChange={handleInputChange}
                        placeholder={
                          formData.productCategory === PRODUCT_TYPES.WINE
                            ? '12.5'
                            : formData.productCategory === PRODUCT_TYPES.BEER
                            ? '5.0'
                            : '40'
                        }
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all pr-12"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] text-sm">
                        %
                      </span>
                    </div>
                    {validationInfo.length > 0 && (
                      <div className="mt-2 text-xs text-[#1B4965] bg-blue-50 p-2 rounded">
                        {validationInfo.map((info, idx) => (
                          <div key={idx}>{info}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Net Contents */}
                  <div className="animate-slideIn animate-delay-300">
                    <label
                      htmlFor="netContents"
                      className="block text-sm font-medium text-[#212529] mb-2"
                    >
                      Net Contents <span className="text-[#d9534f]">*</span>
                    </label>
                    <input
                      type="text"
                      id="netContents"
                      name="netContents"
                      value={formData.netContents}
                      onChange={handleInputChange}
                      placeholder={
                        formData.productCategory === PRODUCT_TYPES.BEER
                          ? 'e.g., 12 fl oz, 355 mL'
                          : 'e.g., 750 mL, 1.75 L'
                      }
                      className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* WINE-SPECIFIC FIELDS */}
                  {formData.productCategory === PRODUCT_TYPES.WINE && (
                    <div className="pt-4 border-t border-[#dee2e6] animate-scaleIn">
                      <h3 className="text-sm font-semibold text-[#212529] mb-3">
                        Wine-Specific Requirements
                      </h3>
                      <div>
                        <label
                          htmlFor="sulfiteDeclaration"
                          className="block text-sm font-medium text-[#212529] mb-2"
                        >
                          Sulfite Declaration <span className="text-[#d9534f]">*</span>
                        </label>
                        <input
                          type="text"
                          id="sulfiteDeclaration"
                          name="sulfiteDeclaration"
                          value={formData.sulfiteDeclaration}
                          onChange={handleInputChange}
                          placeholder='e.g., "Contains Sulfites"'
                          className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all"
                          required
                        />
                        <p className="mt-1.5 text-xs text-[#6c757d]">
                          Required if sulfite content exceeds {WINE_RULES.sulfiteThreshold} ppm
                        </p>
                      </div>
                    </div>
                  )}

                  {/* BEER-SPECIFIC FIELDS */}
                  {formData.productCategory === PRODUCT_TYPES.BEER && (
                    <div className="pt-4 border-t border-[#dee2e6] animate-scaleIn">
                      <h3 className="text-sm font-semibold text-[#212529] mb-3">
                        Beer-Specific Information
                      </h3>
                      <div>
                        <label
                          htmlFor="ingredients"
                          className="block text-sm font-medium text-[#212529] mb-2"
                        >
                          Ingredients <span className="text-[#6c757d] text-xs font-normal">(Optional)</span>
                        </label>
                        <textarea
                          id="ingredients"
                          name="ingredients"
                          value={formData.ingredients}
                          onChange={handleInputChange}
                          placeholder="e.g., Water, Malted Barley, Hops, Yeast"
                          rows={2}
                          className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all resize-none"
                        />
                        <p className="mt-1.5 text-xs text-[#6c757d]">
                          Optional but recommended for transparency
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DISTILLED SPIRITS-SPECIFIC FIELDS */}
                  {formData.productCategory === PRODUCT_TYPES.DISTILLED_SPIRITS && (
                    <div className="pt-4 border-t border-[#dee2e6] animate-scaleIn">
                      <h3 className="text-sm font-semibold text-[#212529] mb-3">
                        Distilled Spirits-Specific Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="distillerName"
                            className="block text-sm font-medium text-[#212529] mb-2"
                          >
                            Distiller/Bottler Name <span className="text-[#6c757d] text-xs font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            id="distillerName"
                            name="distillerName"
                            value={formData.distillerName}
                            onChange={handleInputChange}
                            placeholder="e.g., Distilled by XYZ Distillery"
                            className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="ageStatement"
                            className="block text-sm font-medium text-[#212529] mb-2"
                          >
                            Age Statement <span className="text-[#6c757d] text-xs font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            id="ageStatement"
                            name="ageStatement"
                            value={formData.ageStatement}
                            onChange={handleInputChange}
                            placeholder='e.g., "Aged 12 Years"'
                            className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all"
                          />
                          <p className="mt-1.5 text-xs text-[#6c757d]">
                            If included, must be accurate and verifiable
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HEALTH WARNING - All Categories */}
                  <div className="pt-4 border-t border-[#dee2e6] animate-scaleIn animate-delay-100">
                    <h3 className="text-sm font-semibold text-[#212529] mb-3">
                      Health Warning Statement <span className="text-[#d9534f]">*</span>
                    </h3>
                    <div>
                      <label
                        htmlFor="healthWarning"
                        className="block text-sm font-medium text-[#212529] mb-2"
                      >
                        Warning Text on Label
                      </label>
                      <textarea
                        id="healthWarning"
                        name="healthWarning"
                        value={formData.healthWarning}
                        onChange={handleInputChange}
                        placeholder="Paste the health warning text as it appears on the label..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-[#dee2e6] rounded-md text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:border-transparent transition-all resize-none text-xs"
                        required
                      />
                      <details className="mt-2">
                        <summary className="text-xs text-[#1B4965] cursor-pointer hover:underline">
                          View Required TTB Warning Text
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-[#6c757d] border border-gray-200">
                          <p className="font-mono leading-relaxed whitespace-pre-wrap">
                            {HEALTH_WARNING_TEXT}
                          </p>
                          <p className="mt-2 text-[#212529]">
                            <strong>Note:</strong> Capitalization of "Surgeon General" and exact wording are required by TTB.
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Image Upload */}
            <div className={`${!formData.productCategory ? 'opacity-50 pointer-events-none' : 'animate-slideInRight'}`}>
              <ImageUpload
                onImageSelect={handleImageSelect}
                selectedImage={selectedImage}
              />
              {!formData.productCategory && (
                <p className="mt-4 text-sm text-[#6c757d] text-center">
                  Select a product category to enable image upload
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-[#dee2e6]">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="bg-[#5cb85c] text-white px-8 py-3 rounded-md font-medium hover:bg-[#449d44] focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Submit for Verification'}
            </button>
            <p className="mt-3 text-xs text-[#6c757d]">
              AI will verify label content matches submitted information and complies with TTB regulations
            </p>
          </div>
        </form>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#003d7a] mx-auto"></div>
              <p className="mt-6 text-[#212529] text-center font-medium text-lg">Processing label image...</p>
              <p className="mt-2 text-[#6c757d] text-center text-sm">
                Extracting text with Cloud Vision AI
              </p>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {verificationResults && (
          <div className="mt-8">
            <VerificationResultsPanel
              results={verificationResults.results}
              overallStatus={verificationResults.overallStatus}
              detectedText={verificationResults.detectedText}
            />
          </div>
        )}
      </div>
    </div>
  );
}
