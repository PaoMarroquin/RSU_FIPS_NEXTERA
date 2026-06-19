import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />
        {children}
      </div>
    </div>
  );
};

export default Layout;