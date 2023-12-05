import { Router, navigate } from "@reach/router";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { get } from "../utilities";
import Navbar from "./modules/Navbar";
import { Navbar as NewNavbar } from "./modules/Navbar/Navbar";
const AllStaff = lazy(() => import("./pages/AllStaff"));
const Archives = lazy(() => import("./pages/Archives"));
const Donate = lazy(() => import("./pages/Donate"));
const Mappools = lazy(() => import("./pages/Mappools"));
const NewTourneyHome = lazy(() => import("./pages/NewTourneyHome"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Players = lazy(() => import("./pages/Players"));
const PoolHelper = lazy(() => import("./pages/PoolHelper"));
const Rules = lazy(() => import("./pages/Rules"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Songs = lazy(() => import("./pages/Songs"));
const Stats = lazy(() => import("./pages/Stats"));
const TourneyHome = lazy(() => import("./pages/TourneyHome"));
const TourneyStaff = lazy(() => import("./pages/TourneyStaff"));
import Home from "./pages/home/Home.js";

import YearConfig from "../content/year-config";
import "../global.css";

import { Layout, Spin } from "antd";
import "antd/dist/antd.css";
import "./App.less";
import { RouteWrapper, TourneyRouteWrapper } from "./RouteWrappers";

export default function App() {
  const [user, setUser] = useState({});
  const [loginAttention, setLoginAttention] = useState(false);

  useEffect(() => {
    get("/api/whoami").then((res) => {
      setUser(res);
    });
  }, []);

  /*
    Each route for a tourney can optionally specify a year
    if a year is not specified, it will default to the most recent iteration
    of the tourney.

    TourneyRouteWrapper transforms the 'tourney' prop to include the year of the tourney
    e.g. /2019/igts -> props.tourney === "igts_2019"
    */
  return (
    <Router primary={false}>
      <RouteWrapper path="/" user={user} setUser={setUser} PageComponent={Home} />
      <RouteWrapper path="/archives" user={user} setUser={setUser} PageComponent={Archives} />
      <RouteWrapper path="/pool-helper" user={user} setUser={setUser} PageComponent={PoolHelper} />
      <RouteWrapper
        path="/donate"
        user={user}
        setUser={setUser}
        PageComponent={Donate}
      />
      <RouteWrapper path="/staff" user={user} setUser={setUser} PageComponent={AllStaff} />
      <RouteWrapper path="/songs" user={user} setUser={setUser} PageComponent={Songs} />

      <TourneyRouteWrapper
        user={user}
        setUser={setUser}
        setLoginAttention={setLoginAttention}
        path="/:tourney/home"
        PageComponent={NewTourneyHome}
      />
      <TourneyRouteWrapper
        user={user}
        setUser={setUser}
        setLoginAttention={setLoginAttention}
        path="/:year/:tourney/home"
        PageComponent={NewTourneyHome}
      />

      <TourneyRouteWrapper
        user={user}
        setUser={setUser}
        setLoginAttention={setLoginAttention}
        path="/:tourney/home-old"
        PageComponent={TourneyHome}
      />
      <TourneyRouteWrapper
        user={user}
        setUser={setUser}
        setLoginAttention={setLoginAttention}
        path="/:year/:tourney/home-old"
        PageComponent={TourneyHome}
      />

      <TourneyRouteWrapper user={user} path="/:tourney/staff" PageComponent={TourneyStaff} />
      <TourneyRouteWrapper user={user} path="/:year/:tourney/staff" PageComponent={TourneyStaff} />

      <TourneyRouteWrapper path="/:tourney/rules" PageComponent={Rules} />
      <TourneyRouteWrapper path="/:year/:tourney/rules" PageComponent={Rules} />

      <TourneyRouteWrapper user={user} path="/:tourney/pools" PageComponent={Mappools} />
      <TourneyRouteWrapper user={user} path="/:year/:tourney/pools" PageComponent={Mappools} />

      <TourneyRouteWrapper user={user} path="/:tourney/players" PageComponent={Players} />
      <TourneyRouteWrapper user={user} path="/:year/:tourney/players" PageComponent={Players} />

      <TourneyRouteWrapper user={user} path="/:tourney/schedule" PageComponent={Schedule} />
      <TourneyRouteWrapper user={user} path="/:year/:tourney/schedule" PageComponent={Schedule} />
      <TourneyRouteWrapper user={user} path="/:tourney/stats" PageComponent={Stats} />
      <TourneyRouteWrapper user={user} path="/:year/:tourney/stats" PageComponent={Stats} />

      <NotFound default />
    </Router>
  );
}
