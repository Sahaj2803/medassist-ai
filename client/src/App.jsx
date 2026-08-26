import AppRouter from "./router/AppRouter.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useReminderNotifications } from "./hooks/useReminderNotifications.js";

function App() {
  const { isAuthenticated } = useAuth();
  useReminderNotifications(isAuthenticated);

  return <AppRouter />;
}

export default App;
