import Header from './components/Header';
import VerificationForm from './components/VerificationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-6">
        <VerificationForm />
      </main>

      <footer className="py-6 border-t border-gray-300 bg-[#003d7a] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
            <p className="text-sm text-blue-100">
              Alcohol and Tobacco Tax and Trade Bureau (TTB) Label Verification System
            </p>
            <div className="flex items-center space-x-6">
              <a
                href="https://www.ttb.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                TTB.gov
              </a>
              <a
                href="https://www.ttb.gov/labeling"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                Labeling Guidelines
              </a>
              <a
                href="https://www.ttb.gov/contact-us"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
