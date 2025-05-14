"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePageClient({ token }: { token: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  // Fetch ticket details using the signature token
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/signature/${token}`);
        
        if (!response.ok) {
          throw new Error('Invalid signature link or ticket not found');
        }
        
        const data = await response.json();
        setTicket(data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch ticket');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [token]);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please provide your signature before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get the signature as a base64 encoded PNG
      const signatureData = signatureRef.current.toDataURL('image/png');
      
      // Submit the signature to the API
      const response = await fetch(`/api/signature/${token}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: signatureData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit signature');
      }
      
      setSuccess(true);
      // Redirect to success page after a delay
      setTimeout(() => {
        router.push(`/signature/${token}/success`);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting signature:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mt-2">Error</h2>
          </div>
          <p className="text-gray-700 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-green-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-bold mt-2">Signature Submitted</h2>
          </div>
          <p className="text-gray-700 text-center">Thank you for confirming your address. Redirecting to confirmation page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-white text-xl font-bold">Address Confirmation</h1>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Hello {ticket?.firstName} {ticket?.lastName},</h2>
            <p className="text-gray-600 mb-4">
              Please review and confirm your address by signing below.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Your Official Address:</h3>
              <p className="text-gray-800 font-medium">{ticket?.approvedAddress}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Ticket Information
              </h3>
              <p className="text-sm text-blue-800">
                Ticket Number: {ticket?.ticketNumber || ticket?._id.substring(ticket?._id.length - 6)}
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">Please sign below to confirm your address:</h3>
            <div className="border border-gray-300 rounded-md bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'signature-canvas w-full h-48',
                }}
                backgroundColor="white"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Signature
              </button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>Confirm Address</>  
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
