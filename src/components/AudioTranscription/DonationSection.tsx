import React from 'react';

interface DonationSectionProps {
  showDonation: boolean;
  onToggle: () => void;
}

const BITCOIN_ADDRESS = 'bc1qngl88gth8ufqjx8v9fdx2xdslcvkdnztccn5h3';

export const DonationSection: React.FC<DonationSectionProps> = ({
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
    <div className="donation-section">
      <button 
        className="donation-toggle"
        onClick={onToggle}
      >
        <span className="donation-icon">💝</span>
        <span>Support this project</span>
        <span className={`toggle-arrow ${showDonation ? 'open' : ''}`}>▼</span>
      </button>
      
      {showDonation && (
        <div className="donation-content">
          <p className="donation-message">
            If you find this tool useful, consider supporting its development!
          </p>
          <div className="donation-methods">
            <div className="donation-method">
              <h4>Bitcoin (BTC)</h4>
              <div className="btc-donation">
                <div className="qr-code-container">
                  <img
                    src="/btc-qr-code.png"
                    alt="Bitcoin QR Code"
                    className="qr-code"
                    onError={handleQRCodeError}
                  />
                  <div className="qr-placeholder" style={{display: 'none'}}>
                    <span>QR Code</span>
                    <small>Upload to /public/btc-qr-code.png</small>
                  </div>
                </div>
                <div className="btc-address">
                  <code className="crypto-address" id="btc-address">
                    {BITCOIN_ADDRESS}
                  </code>
                  <button 
                    className="copy-btn"
                    onClick={handleCopyAddress}
                    title="Copy address"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="donation-thanks">Thank you for your support! 🙏</p>
        </div>
      )}
    </div>
  );
};
