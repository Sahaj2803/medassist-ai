import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineEnvelope, HiOutlineLockClosed } from "react-icons/hi2";
import AuthCircleLayout from "../../components/common/AuthCircleLayout.jsx";
import AuthInput from "../../components/common/AuthInput.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (values) => {
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.invalidCredentials"));
    }
  };

  return (
    <AuthCircleLayout
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-signal-400 hover:text-signal-300">
            {t("auth.createOne")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <AuthInput
          id="email"
          type="email"
          icon={HiOutlineEnvelope}
          placeholder={t("auth.email")}
          error={errors.email}
          {...register("email", {
            required: t("auth.emailRequired"),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t("auth.emailInvalid"),
            },
          })}
        />

        <div>
          <AuthInput
            id="password"
            type="password"
            icon={HiOutlineLockClosed}
            placeholder={t("auth.password")}
            error={errors.password}
            {...register("password", { required: t("auth.passwordRequired") })}
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-signal-400 hover:text-signal-300"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-2xl bg-signal-gradient py-3 text-sm font-semibold text-graphite-950
                     shadow-glow-teal transition-transform duration-200 hover:scale-[1.015]
                     active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
        </button>
      </form>
    </AuthCircleLayout>
  );
}

export default LoginPage;
