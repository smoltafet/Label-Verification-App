'use client';

interface VerificationResult {
  field: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  labelText?: string;
  formText?: string;
}

interface VerificationResultsPanelProps {
  results: VerificationResult[];
  overallStatus: 'approved' | 'rejected' | 'needs-review' | null;
  detectedText?: string;
}

export default function VerificationResultsPanel({
  results,
  overallStatus,
  detectedText,
}: VerificationResultsPanelProps) {
  if (!overallStatus || results.length === 0) {
    return null;
  }

  const statusColors = {
    approved: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500',
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
    },
    'needs-review': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
    },
  };

  const colors = statusColors[overallStatus];

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <div className={`rounded-lg border ${colors.border} ${colors.bg} p-6`}>
        <div className="flex items-start space-x-3 mb-6">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            overallStatus === 'approved' ? 'bg-green-500' :
            overallStatus === 'rejected' ? 'bg-red-500' :
            'bg-yellow-500'
          }`}>
            {overallStatus === 'approved' ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : overallStatus === 'rejected' ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              {overallStatus === 'approved' && 'Label Approved'}
              {overallStatus === 'rejected' && 'Label Rejected'}
              {overallStatus === 'needs-review' && 'Manual Review Required'}
            </h3>
            <p className={`text-sm ${colors.text} mt-1`}>
              {overallStatus === 'approved' && 'All verification checks passed. Label meets TTB requirements.'}
              {overallStatus === 'rejected' && 'Label does not meet TTB requirements. Please review issues below.'}
              {overallStatus === 'needs-review' && 'Some fields require manual review by a TTB agent.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-md p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                    result.status === 'pass' ? 'bg-green-100' :
                    result.status === 'fail' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {result.status === 'pass' ? (
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : result.status === 'fail' ? (
                      <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-[#1A1F36]">
                        {result.field}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        result.status === 'pass' ? 'bg-green-100 text-green-700' :
                        result.status === 'fail' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {result.status === 'pass' ? 'Match' : result.status === 'fail' ? 'Mismatch' : 'Review'}
                      </span>
                    </div>
                    <p className="text-sm text-[#697386] mt-1">
                      {result.message}
                    </p>
                    {(result.labelText || result.formText) && (
                      <div className="mt-2 space-y-1">
                        {result.formText && (
                          <div className="text-xs">
                            <span className="font-medium text-[#1A1F36]">Form: </span>
                            <span className="text-[#697386]">{result.formText}</span>
                          </div>
                        )}
                        {result.labelText && (
                          <div className="text-xs">
                            <span className="font-medium text-[#1A1F36]">Label: </span>
                            <span className="text-[#697386]">{result.labelText}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#697386]">
              Verification completed using AI image analysis and OCR
            </p>
            <button
              type="button"
              className="text-sm text-[#1B4965] hover:underline font-medium"
              onClick={() => window.print()}
            >
              Print Report
            </button>
          </div>
        </div>

        {/* Full OCR Text (collapsible) */}
        {detectedText && (
          <details className="mt-6 pt-4 border-t border-gray-200">
            <summary className="cursor-pointer text-sm font-medium text-[#003d7a] hover:underline">
              View Full Extracted Text from Label
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs font-mono text-[#212529] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                {detectedText}
              </p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
