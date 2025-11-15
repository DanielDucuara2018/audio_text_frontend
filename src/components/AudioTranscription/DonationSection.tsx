import React from 'react';

interface DonationSectionProps {
  showDonation: boolean;
  onToggle: () => void;
}

const BITCOIN_ADDRESS = 'bc1qngl88gth8ufqjx8v9fdx2xdslcvkdnztccn5h3';

export const DonationSection: React.FC<DonationSectionProps> = React.memo(({
  showDonation,
  onToggle,
}) => {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(BITCOIN_ADDRESS);
    alert('Bitcoin address copied!');
  };

  const handleQRCodeError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const placeholder = target.nextElementSibling as HTMLElement;
    target.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  return (
    <div className="mb-6">
      <button 
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-pink-50 to-purple-50 
                   dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800
                   hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30
                   transition-all duration-300 group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse-slow">💝</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">Support this project</span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${showDonation ? 'rotate-180' : ''}`}
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
        </svg>
      </button>
      
      {showDonation && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-down">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            If you find this tool useful, consider supporting its development! 🚀
          </p>
          
          <div className="space-y-4">
            {/* Bitcoin Card */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 
                            rounded-xl p-5 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.24,10.56C13.93,11.8 12.03,11.17 11.4,11C11.18,11.7 10.96,12.4 10.74,13.1C11.42,13.3 13.76,14.06 14.16,12.46C14.41,11.47 14.59,10.46 14.24,10.56M11.13,14.07C10.91,14.77 10.69,15.47 10.46,16.17C11.14,16.36 13.5,17.13 13.91,15.51C14.21,14.27 13.66,13.82 11.13,14.07M12,2C6.5,2 2,6.5 2,12C2,17.5 6.5,22 12,22C17.5,22 22,17.5 22,12C22,6.5 17.5,2 12,2M13.94,17.69L13.03,18.19L12.75,19.11L10.92,19.11L11.07,18.41C10.8,18.5 10.53,18.58 10.26,18.65L9.97,19.57L8.14,19.57L8.42,18.65C8.17,18.71 7.93,18.77 7.69,18.82L6.56,19.08L7.05,17.35L7.77,17.19C8.06,17.12 8.16,16.95 8.23,16.8L9.63,11.59C9.64,11.39 9.6,11.1 9.29,11.17L8.58,11.33L9.06,9.6L10.27,9.32C10.49,9.27 10.72,9.22 10.95,9.18L11.24,8.26L13.07,8.26L12.79,9.15C13.04,9.1 13.28,9.06 13.53,9L13.82,8.09L15.65,8.09L15.36,9C16.83,8.88 17.7,9.4 17.46,10.63C17.28,11.54 16.74,12.12 16,12.38C16.63,12.62 17,13.15 16.88,14.03C16.69,15.31 15.69,16.67 13.94,17.69Z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Bitcoin (BTC)</h4>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-white rounded-lg p-2 shadow-md">
                    <img
                      src="/btc-qr-code.png"
                      alt="Bitcoin QR Code"
                      className="w-full h-full object-contain"
                      onError={handleQRCodeError}
                    />
                    <div className="hidden flex-col items-center justify-center h-full text-xs text-gray-500">
                      <span>QR Code</span>
                      <small className="text-center mt-1">Upload to /public/btc-qr-code.png</small>
                    </div>
                  </div>
                </div>
                
                {/* Address */}
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Bitcoin Address</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 
                                     rounded-lg border border-gray-300 dark:border-gray-700 font-mono break-all">
                      {BITCOIN_ADDRESS}
                    </code>
                    <button 
                      className="flex-shrink-0 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg
                                 transition-colors shadow-md hover:shadow-lg"
                      onClick={handleCopyAddress}
                      title="Copy address"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Thank you for your support! 🙏
          </p>
        </div>
      )}
    </div>
  );
});
