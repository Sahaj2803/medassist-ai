import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlinePhone,
} from "react-icons/hi2";
import AuthCircleLayout from "../../components/common/AuthCircleLayout.jsx";
import AuthInput from "../../components/common/AuthInput.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { t } = useLanguage();
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
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.registrationFailed"));
    }
  };

  return (
    <AuthCircleLayout
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-signal-400 hover:text-signal-300">
            {t("auth.login")}
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

        {/*
          Name + Phone share a row — both translate to short words in
          English/Hindi/Gujarati so they stay legible at this width.
          Password/Confirm password are kept full-width below since
          those translated strings run much longer (especially
          Hindi/Gujarati) and would clip in a narrow column.
        */}
        <div className="grid grid-cols-2 gap-2.5">
          <AuthInput
            id="name"
            icon={HiOutlineUser}
            placeholder={t("auth.fullName")}
            error={errors.name}
            {...register("name", { required: t("auth.nameRequired") })}
          />

          <AuthInput
            id="phone"
            type="tel"
            icon={HiOutlinePhone}
            placeholder={t("profile.phone")}
            error={errors.phone}
            {...register("phone")}
          />
        </div>

        <AuthInput
          id="password"
          type="password"
          icon={HiOutlineLockClosed}
          placeholder={t("auth.password")}
          error={errors.password}
          {...register("password", {
            required: t("auth.passwordRequired"),
            minLength: { value: 8, message: t("auth.passwordMinLength") },
          })}
        />

        <AuthInput
          id="confirmPassword"
          type="password"
          icon={HiOutlineLockClosed}
          placeholder={t("auth.confirmPassword")}
          error={errors.confirmPassword}
          {...register("confirmPassword", {
            required: t("auth.confirmPasswordRequired"),
            validate: (value) => value === password || t("auth.passwordsDontMatch"),
          })}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-2xl bg-signal-gradient py-3 text-sm font-semibold text-graphite-950
                     shadow-glow-teal transition-transform duration-200 hover:scale-[1.015]
                     active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>
      </form>
    </AuthCircleLayout>
  );
}

export default RegisterPage;
