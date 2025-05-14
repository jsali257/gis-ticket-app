// Server Component wrapper
import SignaturePageClient from './SignaturePageClient';

export default async function SignaturePage({ params }: { params: { token: string } }) {
  // Properly await the token in the server component
  const token = await params.token;
  
  // Pass the resolved token to the client component
  return <SignaturePageClient token={token} />;
}
