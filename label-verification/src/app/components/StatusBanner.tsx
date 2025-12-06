interface StatusBannerProps {
  type: 'success' | 'error' | null;
  message: string;
  onClose?: () => void;
}

export default function StatusBanner({ type, message, onClose }: StatusBannerProps) {
  if (!type) return null;

  const isSuccess = type === 'success';
  
  return (
    <div
      className={`rounded border p-4 mb-6 flex items-start justify-between ${
        isSuccess
          ? 'bg-green-50 border-[#5cb85c]'
          : 'bg-red-50 border-[#d9534f]'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
            isSuccess ? 'bg-[#5cb85c]' : 'bg-[#d9534f]'
          }`}
        >
          {isSuccess ? (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <div>
          <p
            className={`text-sm font-medium ${
              isSuccess ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message}
          </p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${
            isSuccess ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
