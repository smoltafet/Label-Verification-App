import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full bg-[#1e3a5f] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo Image */}
          <div className="flex items-center justify-center">
            <Image
              src="/Logo.png"
              alt="TTB Logo"
              width={60}
              height={60}
              priority
              className="object-contain"
            />
          </div>
          
          {/* Divider Line */}
          <div className="h-16 w-px bg-white/40"></div>
          
          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <div className="text-white leading-tight">
              <p className="text-lg font-medium">Alcohol and Tobacco</p>
              <p className="text-lg font-medium">Tax and Trade Bureau</p>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              U.S. Department of the Treasury
            </p>
          </div>
        </div>
        
        <nav>
          <a
            href="https://www.ttb.gov/labeling"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white hover:text-blue-200 transition-colors font-medium"
          >
            Labeling Guidelines
          </a>
        </nav>
      </div>
    </header>
  );
}
