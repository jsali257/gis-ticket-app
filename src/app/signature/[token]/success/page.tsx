// Server Component wrapper
import SuccessPageClient from './SuccessPageClient';

export default async function SignatureSuccessPage({ params }: { params: { token: string } }) {
  // Properly await the token in the server component
  const token = await params.token;
  
  // Pass the resolved token to the client component
  return <SuccessPageClient token={token} />;
}
