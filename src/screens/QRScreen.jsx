// Static pastel blobs instead of random ones

const QRScreen = () => {
  // Generate QR code URL (you can replace this with actual QR code generation)
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent("https://www.pimpmycase.co.uk")

  return (
    <div className="screen-container" style={{ background: '#fdfdfd' }}>
      {/* Static pastel blobs – green top-left, pink bottom-right */}
      <div className="absolute top-[-140px] left-[-120px] w-[500px] h-[340px] bg-[#D4EFC1] rounded-[60%_40%_55%_45%/50%_60%_45%_50%] opacity-70"></div>
      <div className="absolute bottom-[-160px] right-[-140px] w-[480px] h-[320px] bg-[#FFD6E2] rounded-[65%_35%_55%_45%/60%_50%_65%_40%] opacity-70"></div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 py-12">
        {/* Header */}
        <div className="text-center mt-8">
          <h1
            style={{
              fontSize: '48px',
              fontFamily: 'Futura Heavy, Futura, sans-serif',
              fontWeight: '900',
              color: '#333333',
              textAlign: 'center',
              margin: '0 0 80px 0',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}
          >
            SCAN QR CODE TO BEGIN
          </h1>
        </div>

        {/* Main Content Area */}
        <div className="flex w-full max-w-2xl mx-auto items-center justify-center">
          {/* Outer card with thick pastel-blue border */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full bg-white rounded-[80px] border-[48px] border-[#CBE8F4] p-4 md:p-8 relative">
            {/* Left column – description and camera slot placeholder */}
            <div className="flex-1 flex flex-col items-start md:items-start">
              {/* Description text */}
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '300',
                  color: '#999999',
                  lineHeight: '1.4'
                }}
              >
                DESIGN YOUR <span style={{ fontWeight: '700' }}>AI</span><br/>
                POWERED <span style={{ fontWeight: '700' }}>3D</span> PHOTO<br/>
                PHONE CASE IN UNDER<br/>
                <span style={{ fontWeight: '700', fontSize: '24px' }}>5</span> MINUTES
              </div>

              {/* Camera slot placeholder */}
              <div className="mt-8 w-40 h-24 bg-white border-[40px] border-[#CBE8F4] rounded-full"></div>
            </div>

            {/* Right column – QR code */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p
            style={{
              fontSize: '16px',
              fontWeight: '300',
              color: '#999999'
            }}
          >
            www.pimpmycase.co.uk
          </p>
        </div>
      </div>
    </div>
  )
}

export default QRScreen 