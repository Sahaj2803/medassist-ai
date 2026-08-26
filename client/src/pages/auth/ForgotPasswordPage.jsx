import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/common/AuthLayout.jsx";
import FormField from "../../components/common/FormField.jsx";
import authService from "../../services/authService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    try {
      await authService.forgotPassword(values);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.forgotGenericError"));
    }
  };

  return (
    <AuthLayout
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={
        <Link to="/login" className="font-semibold text-signal-400 hover:text-signal-500">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <p className="text-sm text-mist-200">{t("auth.resetLinkSentBody")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            id="email"
            label={t("auth.email")}
            type="email"
            placeholder="you@example.com"
            error={errors.email}
            {...register("email", {
              required: t("auth.emailRequired"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t("auth.emailInvalid"),
              },
            })}
          />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t("auth.sending") : t("auth.sendResetLink")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
