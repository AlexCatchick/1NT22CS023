import React, { useState } from "react";
import Shortener from "./pages/Shortener";
import Statistics from "./pages/Statistics";

function App() {
  const [currentPage, setCurrentPage] = useState("shortener");
  const switchPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="navigation">
        <div className="nav-container">
          <h1 className="nav-title">URL Shortener App</h1>
          <div className="nav-buttons">
            <button
              className={`nav-btn ${currentPage === "shortener" ? "active" : ""}`}
              onClick={() => switchPage("shortener")}
            >
              URL Shortener
            </button>
            <button
              className={`nav-btn ${currentPage === "statistics" ? "active" : ""}`}
              onClick={() => switchPage("statistics")}
            >
              Statistics
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        {currentPage === "shortener" && <Shortener />}
        {currentPage === "statistics" && <Statistics />}
      </main>
    </div>
  );
}

export default App;
