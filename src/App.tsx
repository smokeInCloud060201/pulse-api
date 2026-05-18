import React from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TabBar } from "./components/layout/TabBar";
import "./styles/theme.css";

function App() {
  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <TabBar />
          {/* Main workspace will go here */}
          <div style={{ padding: "24px", flex: 1 }}>
            <h2 style={{ marginBottom: "16px" }}>Pulse API Workspace</h2>
            <p style={{ color: "hsl(var(--text-muted))" }}>Select a request from the sidebar or create a new one.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
