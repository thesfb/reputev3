import AppSidebar from "@/components/AppSidebar";
import RelayerFlow from "@/components/RelayerFlow";

const AppDashboard = () => {
  return (
    <div className="gradient-bg min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-xl mx-auto">
          <RelayerFlow />
        </div>
      </main>
    </div>
  );
};

export default AppDashboard;
