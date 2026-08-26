import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/common/AuthLayout.jsx";
import FormField from "../../components/common/FormField.jsx";
import authService from "../../services/authService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function ResetPasswordPage() {
  const { t } = useLanguage();
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (values) => {
    try {
      await authService.resetPassword(resetToken, { password: values.password });
      toast.success(t("auth.resetSuccess"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.resetLinkInvalid"));
    }
  };

  return (
    <AuthLayout title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          id="password"
          label={t("auth.newPassword")}
          type="password"
          placeholder={t("auth.newPasswordPlaceholder")}
          error={errors.password}
          {...register("password", {
            required: t("auth.passwordRequired"),
            minLength: { value: 8, message: t("auth.passwordMinLength") },
          })}
        />
        <FormField
          id="confirmPassword"
          label={t("auth.confirmPassword")}
          type="password"
          placeholder={t("auth.reenterPassword")}
          error={errors.confirmPassword}
          {...register("confirmPassword", {
            required: t("auth.confirmPasswordRequired"),
            validate: (value) => value === password || t("auth.passwordsDontMatch"),
          })}
        />
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? t("auth.resetting") : t("auth.resetPassword")}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
