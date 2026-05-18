import React, { useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TabBar } from "./components/layout/TabBar";
import { RequestEditor } from "./components/request/RequestEditor";
import { useTabStore } from "./stores/tabStore";
import "./styles/theme.css";

function App() {
  const { init, isInitialized, activeTabId, tabs } = useTabStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <TabBar />
          {!isInitialized ? (
            <div style={{ padding: "24px", flex: 1 }}>Loading...</div>
          ) : tabs.length === 0 ? (
            <div style={{ padding: "24px", flex: 1 }}>
              <h2 style={{ marginBottom: "16px" }}>Pulse API Workspace</h2>
              <p style={{ color: "hsl(var(--text-muted))" }}>Select a request from the sidebar or create a new one.</p>
            </div>
          ) : activeTabId ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <RequestEditor requestId={activeTabId} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
