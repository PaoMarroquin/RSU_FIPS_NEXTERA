import { FiBell, FiSearch } from "react-icons/fi";
import "../styles/topbar.css";

export default function Topbar() {
  return (
    <header className="topbar">

      <div className="search-box">

        <FiSearch />

        <input
          type="text"
          placeholder="Buscar proyectos, usuarios, informes..."
        />

      </div>

      <div className="user-area">

        <FiBell className="bell" />

        <div className="avatar">
          P
        </div>

        <div>
          <strong>Pedro Marroquín</strong>
          <span>DOCENTE</span>
        </div>

      </div>

    </header>
  );
}