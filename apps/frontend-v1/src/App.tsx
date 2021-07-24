import React from "react";
import { Web3WorkhardApp } from "@workhard/react-core";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./App.css";
import Mine from "./pages/mine";
import Work from "./pages/work";
import Gov from "./pages/gov";
import Res from "./pages/Res";
import DAO from "./pages/dao";
import Store from "./pages/store";
import { Project } from "./pages/etc/Project";
import { Manufacture } from "./pages/store/tabs/Manufacture";
import { ForkAndLaunch } from "./pages/dao/ForkAndLaunch";
import { ProductPage } from "./pages/store/tabs/ProductPage";
import { MultisigAdmin } from "./pages/multisig/MultisigAdmin";
import Dashboard from "./pages/dashboard/Dashboard";
import { ToastProvider } from "react-toast-notifications";
import { Toast } from "@workhard/react-components";

function App() {
  return (
    <Web3WorkhardApp daoId={0}>
      <ToastProvider
        components={{ Toast }}
        autoDismiss={true}
        autoDismissTimeout={5000}
      >
        <Router>
          <Switch>
            <Route path="/work/:tab?/:subtab?" children={<Work />} />
            <Route path="/mine/:tab?" children={<Mine />} />
            <Route path="/gov/:tab?/:subtab?" children={<Gov />} />
            <Route path="/store/:tab?" children={<Store />} />
            <Route path="/res" children={<Res />} />
            <Route path="/dao/:step/:projId?" children={<ForkAndLaunch />} />
            <Route path="/dao" children={<DAO />} />
            <Route path="/proj/:id" children={<Project />} />
            <Route path="/product/:address" children={<ProductPage />} />
            <Route path="/manufacturer/new" children={<Manufacture />} />
            <Route path="/multisig" children={<MultisigAdmin />} />
            <Route
              path="/docs"
              component={() => {
                window.location.replace("https://gitbook.io");
                return null;
              }}
            />
            <Route path="/" children={<Dashboard />} />
          </Switch>
        </Router>
      </ToastProvider>
    </Web3WorkhardApp>
  );
}

export default App;
