import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
