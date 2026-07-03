import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme/theme";
import App from "./App";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}><BrowserRouter><App /></BrowserRouter></ThemeProvider>
);
