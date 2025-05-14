"use client";

export default function SuccessPageClient({ token }: { token: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h1 className="text-white text-xl font-bold">Address Confirmed</h1>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600">
              Your address has been successfully confirmed.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">What happens next?</h3>
            <ul className="text-gray-600 space-y-2 list-disc pl-5">
              <li>Our team will generate your official address letter</li>
              <li>You will receive an email with the address letter attached</li>
              <li>Keep this document for your records</li>
            </ul>
          </div>
          
          <div className="text-center text-gray-500 text-sm">
            <p>If you have any questions, please contact our GIS department.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
