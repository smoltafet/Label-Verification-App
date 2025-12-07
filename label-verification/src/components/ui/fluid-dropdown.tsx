"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown, Wine, Beer, Martini } from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for className merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Custom hook for click outside detection
function useClickAway(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline"
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "outline" && "border border-[#dee2e6] bg-transparent",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

// Types
interface Category {
  id: string
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const categories: Category[] = [
  { 
    id: "wine", 
    label: "Wine", 
    icon: Wine, 
    color: "#8B1538",
    description: "Fermented grape beverage"
  },
  { 
    id: "beer", 
    label: "Beer", 
    icon: Beer, 
    color: "#F9C74F",
    description: "Fermented malt beverage"
  },
  { 
    id: "distilled_spirits", 
    label: "Distilled Spirits", 
    icon: Martini, 
    color: "#1B4965",
    description: "Whiskey, Vodka, Rum, etc."
  },
]

// Icon wrapper with animation
const IconWrapper = ({
  icon: Icon,
  isHovered,
  color,
}: { icon: React.ElementType; isHovered: boolean; color: string }) => (
  <motion.div 
    className="w-5 h-5 mr-3 relative" 
    initial={false} 
    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
  >
    <Icon className="w-5 h-5" style={{ color: isHovered ? color : 'inherit' }} strokeWidth={2} />
  </motion.div>
)

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
}

// Main component
interface ProductCategoryDropdownProps {
  value: string
  onChange: (categoryId: string) => void
}

export function ProductCategoryDropdown({ value, onChange }: ProductCategoryDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<Category>(
    categories.find(c => c.id === value) || categories[0]
  )
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useClickAway(dropdownRef, () => setIsOpen(false))

  React.useEffect(() => {
    const category = categories.find(c => c.id === value)
    if (category) {
      setSelectedCategory(category)
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const handleSelect = (category: Category) => {
    setSelectedCategory(category)
    onChange(category.id)
    setIsOpen(false)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="w-full relative"
        ref={dropdownRef}
      >
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full justify-between bg-white text-[#212529]",
            "hover:bg-gray-50 hover:border-[#003d7a]",
            "focus:ring-2 focus:ring-[#003d7a] focus:ring-offset-2",
            "transition-all duration-200 ease-in-out",
            "border-[#dee2e6] focus:border-[#003d7a]",
            "h-12 px-4",
            isOpen && "bg-gray-50 border-[#003d7a]",
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="flex items-center">
            <IconWrapper 
              icon={selectedCategory.icon} 
              isHovered={false} 
              color={selectedCategory.color} 
            />
            <span className="font-medium">{selectedCategory.label}</span>
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center w-5 h-5"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 1, y: 0, height: 0 }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                },
              }}
              exit={{
                opacity: 0,
                y: 0,
                height: 0,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                },
              }}
              className="absolute left-0 right-0 top-full mt-2 z-[100]"
              onKeyDown={handleKeyDown}
            >
              <motion.div
                className="w-full rounded-lg border border-[#dee2e6] bg-white p-2 shadow-xl"
                initial={{ borderRadius: 8 }}
                animate={{
                  borderRadius: 12,
                  transition: { duration: 0.2 },
                }}
                style={{ transformOrigin: "top" }}
              >
                <motion.div 
                  className="py-1 relative" 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                >
                  <motion.div
                    layoutId="hover-highlight"
                    className="absolute inset-x-2 bg-[#F5F5F5] rounded-md"
                    animate={{
                      y: categories.findIndex((c) => (hoveredCategory || selectedCategory.id) === c.id) * 56 + 2,
                      height: 52,
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.15,
                      duration: 0.5,
                    }}
                  />
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      onClick={() => handleSelect(category)}
                      onHoverStart={() => setHoveredCategory(category.id)}
                      onHoverEnd={() => setHoveredCategory(null)}
                      className={cn(
                        "relative flex w-full items-center px-4 py-3 text-sm rounded-md",
                        "transition-colors duration-150",
                        "focus:outline-none",
                        selectedCategory.id === category.id || hoveredCategory === category.id
                          ? "text-[#212529]"
                          : "text-[#6c757d]",
                      )}
                      whileTap={{ scale: 0.98 }}
                      variants={itemVariants}
                    >
                      <IconWrapper
                        icon={category.icon}
                        isHovered={hoveredCategory === category.id}
                        color={category.color}
                      />
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-medium text-sm leading-tight">{category.label}</span>
                        <span className="text-xs text-[#6c757d] leading-tight">{category.description}</span>
                      </div>
                      {selectedCategory.id === category.id && (
                        <motion.div
                          className="ml-2 flex-shrink-0"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-[#5cb85c]" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
