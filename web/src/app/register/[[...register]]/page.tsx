import { SignUp } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <a href="/" className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">Monitra</span>
      </a>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card border border-border shadow-lg",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            formFieldInput: "bg-background border-border text-foreground",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
        routing="path"
        path="/register"
        signInUrl="/login"
      />
    </div>
  );
}
