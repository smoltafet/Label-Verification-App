'use client';

import { useState } from 'react';
import { ProductType, PRODUCT_TYPES } from '../constants/ttb-rules';

interface CategoryOption {
  value: ProductType;
  label: string;
  description: string;
  icon: string;
}

const categories: CategoryOption[] = [
  {
    value: PRODUCT_TYPES.WINE,
    label: 'Wine',
    description: 'Table, Dessert, or Sparkling Wine',
    icon: '🍷',
  },
  {
    value: PRODUCT_TYPES.BEER,
    label: 'Beer',
    description: 'Malt Beverages & Craft Beer',
    icon: '🍺',
  },
  {
    value: PRODUCT_TYPES.DISTILLED_SPIRITS,
    label: 'Distilled Spirits',
    description: 'Whiskey, Vodka, Gin, Rum, etc.',
    icon: '🥃',
  },
];

interface CategorySelectorProps {
  value: ProductType | '';
  onChange: (value: ProductType) => void;
}

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      <label className="block text-sm font-semibold text-[#212529] mb-3">
        Product Category <span className="text-[#d9534f]">*</span>
      </label>
      <div className="grid grid-cols-1 gap-3">
        {categories.map((category, index) => {
          const isSelected = value === category.value;
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => onChange(category.value)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                relative w-full text-left p-4 rounded border-2 transition-all duration-300 ease-out
                ${
                  isSelected
                    ? 'border-[#003d7a] bg-blue-50 shadow-md scale-[1.02]'
                    : isHovered
                    ? 'border-[#0056b3] bg-gray-50 shadow-sm scale-[1.01]'
                    : 'border-[#dee2e6] bg-white hover:border-gray-400'
                }
              `}
              style={{
                transform: isSelected ? 'scale(1.02)' : isHovered ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded flex items-center justify-center text-2xl transition-all duration-300
                    ${
                      isSelected
                        ? 'bg-[#003d7a] shadow-lg scale-110'
                        : 'bg-gray-100 scale-100'
                    }
                  `}
                >
                  {isSelected ? (
                    <span className="text-white animate-bounce">{category.icon}</span>
                  ) : (
                    <span>{category.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3
                      className={`
                        text-base font-semibold transition-colors duration-200
                        ${isSelected ? 'text-[#003d7a]' : 'text-[#212529]'}
                      `}
                    >
                      {category.label}
                    </h3>
                    {isSelected && (
                      <div className="animate-fadeIn">
                        <svg
                          className="w-5 h-5 text-[#5cb85c]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p
                    className={`
                      text-sm mt-0.5 transition-colors duration-200
                      ${isSelected ? 'text-[#0056b3]' : 'text-[#6c757d]'}
                    `}
                  >
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Selection indicator */}
              <div
                className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-l transition-all duration-300
                  ${isSelected ? 'bg-[#003d7a] opacity-100' : 'bg-transparent opacity-0'}
                `}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[#6c757d]">
        Select the beverage category to show relevant fields
      </p>
    </div>
  );
}
