import LoginFooter from "./LoginFooter";
import RegisterCard from "./RegisterCard";

export default function RegisterScreen() {
  return (
    <div className="flex flex-col flex-1 justify-between selection:bg-primary selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4">
        <RegisterCard />
      </main>
      <LoginFooter />
    </div>
  );
}
