import LoginCard from "./LoginCard";
import LoginFooter from "./LoginFooter";

export default function LoginScreen() {
  return (
    <div className="flex flex-col flex-1 justify-between selection:bg-primary selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4">
        <LoginCard />
      </main>
      <LoginFooter />
    </div>
  );
}
