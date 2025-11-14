import React, { useEffect, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Board from "./components/Board";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import { useSelector } from "react-redux";

const RequireAuth = ({ children }) => {
  const token = useSelector((state) => state.auth?.token);
  const location = useLocation();

  if (!token) {
    const search = new URLSearchParams();
    search.set("redirect", `${location.pathname}${location.search}`);
    return <Navigate to={`/login?${search.toString()}`} replace />;
  }

  return children;
};

const App = () => {
  const getInitialMode = () => {
    const saved = localStorage.getItem("themeMode");
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? "dark" : "light";
  };

  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    try { localStorage.setItem("themeMode", mode); } catch (_) {}
  }, [mode]);

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));

  const BoardView = (
    <RequireAuth>
      <DndProvider backend={HTML5Backend}>
        <Board themeMode={mode} onToggleTheme={toggleMode} />
      </DndProvider>
    </RequireAuth>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/*" element={BoardView} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;