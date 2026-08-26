import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { HiOutlineUserCircle, HiOutlineCheck, HiOutlineLanguage } from "react-icons/hi2";
import FormField from "../components/common/FormField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useLanguage } from "../hooks/useLanguage.js";

function ProfilePage() {
  const { user, updateProfile, updatePassword } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm();

  const onProfileSubmit = async (values) => {
    try {
      await updateProfile(values);
    } catch (err) {
      toast.error(err.response?.data?.message || t("profile.couldNotUpdateProfile"));
    }
  };

  const onPasswordSubmit = async (values, e) => {
    try {
      await updatePassword(values);
      e.target.reset();
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || t("profile.couldNotUpdatePassword"));
    }
  };

  return (
    <div className="container-shell py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient">
            <HiOutlineUserCircle className="h-9 w-9 text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-sm text-mist-400">{user?.email}</p>
          </div>
        </div>

        <div className="glass-panel mt-10 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">{t("profile.profileDetails")}</h2>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="mt-6 space-y-5"
            noValidate
          >
            <FormField
              id="name"
              label={t("profile.fullName")}
              error={profileForm.formState.errors.name}
              {...profileForm.register("name", { required: t("profile.nameRequired") })}
            />
            <FormField
              id="phone"
              label={t("profile.phone")}
              type="tel"
              placeholder={t("profile.phonePlaceholder")}
              error={profileForm.formState.errors.phone}
              {...profileForm.register("phone")}
            />
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="btn-primary"
            >
              {profileForm.formState.isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
            </button>
          </form>
        </div>

        <div className="glass-panel mt-6 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <HiOutlineLanguage className="h-5 w-5 text-signal-400" />
            <h2 className="text-lg font-semibold text-white">{t("language.preferenceTitle")}</h2>
          </div>
          <p className="mt-1.5 text-sm text-mist-300">{t("language.preferenceDescription")}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {languages.map((lang) => {
              const selected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  aria-pressed={selected}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? "border-signal-400/60 bg-signal-500/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-xl" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <span className={`text-sm font-medium ${selected ? "text-white" : "text-mist-100"}`}>
                      {lang.nativeLabel}
                    </span>
                  </span>
                  {selected && <HiOutlineCheck className="h-5 w-5 shrink-0 text-signal-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">{t("profile.changePassword")}</h2>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="mt-6 space-y-5"
            noValidate
          >
            <FormField
              id="currentPassword"
              label={t("profile.currentPassword")}
              type="password"
              error={passwordForm.formState.errors.currentPassword}
              {...passwordForm.register("currentPassword", {
                required: t("profile.currentPasswordRequired"),
              })}
            />
            <FormField
              id="newPassword"
              label={t("profile.newPassword")}
              type="password"
              error={passwordForm.formState.errors.newPassword}
              {...passwordForm.register("newPassword", {
                required: t("profile.newPasswordRequired"),
                minLength: { value: 8, message: t("profile.passwordMinLength") },
              })}
            />
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="btn-secondary"
            >
              {passwordForm.formState.isSubmitting ? t("profile.updating") : t("profile.updatePassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
