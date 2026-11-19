import { AuthForm } from "@/app/auth/components/auth-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  return (
    <AuthForm
      view="reset-password"
      token={params.token}
      invalidToken={params.error === "INVALID_TOKEN"}
    />
  );
}
