import { Router, navigate } from "@reach/router";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { get } from "../utilities.js";
const AllStaff = lazy(() => import("./pages/AllStaff.js"));
const Archives = lazy(() => import("./pages/Archives.js"));
const Donate = lazy(() => import("./pages/Donate.js"));
const Mappools = lazy(() => import("./pages/Mappools.js"));
const NewTourneyHome = lazy(() => import("./pages/NewTourneyHome.js"));
const NotFound = lazy(() => import("./pages/NotFound.js"));
const Players = lazy(() => import("./pages/Players.js"));
const PoolHelper = lazy(() => import("./pages/PoolHelper.js"));
const Rules = lazy(() => import("./pages/Rules.js"));
const Schedule = lazy(() => import("./pages/Schedule.js"));
const Songs = lazy(() => import("./pages/Songs.js"));
const Stats = lazy(() => import("./pages/Stats.js"));
const TourneyHome = lazy(() => import("./pages/TourneyHome.js"));
const TourneyStaff = lazy(() => import("./pages/TourneyStaff.js"));
import Home from "./pages/home/Home.js";

import "../global.css";

import { Layout, Spin } from "antd";
import "antd/dist/antd.css";
import "./App.less";
import { RouteWrapper, TourneyRouteWrapper } from "./RouteWrappers";
import { User } from "../models/user";
import { LanguageContext, contentManager } from "../ContentManager";

export default function App() {
  const [user, setUser] = useState<User | undefined>();
  const [loginAttention, setLoginAttention] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem("lang") ?? "en");

  contentManager.onLanguageSet((lang) => {
    setLang(lang);
  });

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
    <LanguageContext.Provider value={lang}>
      <Router primary={false}>
        <RouteWrapper path="/" user={user} setUser={setUser} PageComponent={Home} />
        <RouteWrapper path="/archives" user={user} setUser={setUser} PageComponent={Archives} />
        <RouteWrapper
          path="/pool-helper"
          user={user}
          setUser={setUser}
          PageComponent={PoolHelper}
        />
        <RouteWrapper path="/donate" user={user} setUser={setUser} PageComponent={Donate} />
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

        <TourneyRouteWrapper
          user={user}
          setUser={setUser}
          path="/:tourney/staff"
          PageComponent={TourneyStaff}
        />
        <TourneyRouteWrapper
          user={user}
          setUser={setUser}
          path="/:year/:tourney/staff"
          PageComponent={TourneyStaff}
        />

        <TourneyRouteWrapper
          user={user}
          path="/:tourney/rules"
          setUser={setUser}
          PageComponent={Rules}
        />
        <TourneyRouteWrapper
          user={user}
          path="/:year/:tourney/rules"
          setUser={setUser}
          PageComponent={Rules}
        />

        <TourneyRouteWrapper
          user={user}
          path="/:tourney/pools"
          setUser={setUser}
          PageComponent={Mappools}
        />
        <TourneyRouteWrapper
          user={user}
          path="/:year/:tourney/pools"
          setUser={setUser}
          PageComponent={Mappools}
        />

        <TourneyRouteWrapper
          user={user}
          path="/:tourney/players"
          setUser={setUser}
          PageComponent={Players}
        />
        <TourneyRouteWrapper
          user={user}
          path="/:year/:tourney/players"
          setUser={setUser}
          PageComponent={Players}
        />

        <TourneyRouteWrapper
          user={user}
          path="/:tourney/schedule"
          setUser={setUser}
          PageComponent={Schedule}
        />
        <TourneyRouteWrapper
          user={user}
          path="/:year/:tourney/schedule"
          setUser={setUser}
          PageComponent={Schedule}
        />
        <TourneyRouteWrapper
          user={user}
          path="/:tourney/stats"
          setUser={setUser}
          PageComponent={Stats}
        />
        <TourneyRouteWrapper
          user={user}
          path="/:year/:tourney/stats"
          setUser={setUser}
          PageComponent={Stats}
        />

        <NotFound default />
      </Router>
    </LanguageContext.Provider>
  );
}
