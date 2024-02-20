import { Router } from "@reach/router";
import React, { PropsWithChildren, createContext, lazy, useEffect, useState } from "react";
import { get } from "../utilities.js";
import Home from "./pages/home/Home.js";
import { useMatchMedia } from "../utilities";
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

import "../global.css";

import "antd/dist/antd.css";
import { LanguageContext, contentManager } from "../ContentManager";
import { User } from "../models/user";
import "./App.less";
import { RouteWrapper, TourneyRouteWrapper } from "./RouteWrappers";

export type LayoutType = "wide" | "medium" | "narrow";

export const LayoutTypeContext = createContext<LayoutType>("narrow");

function AppContextWrapper(props: PropsWithChildren<{}>) {
  const [lang, setLang] = useState(localStorage.getItem("lang") ?? "en");
  const [layoutType, setLayoutType] = useState<LayoutType>("narrow");

  contentManager.onLanguageSet((lang) => {
    setLang(lang);
  });

  const wide: MediaQueryList = useMatchMedia("(min-width:1280px)");
  const medium: MediaQueryList = useMatchMedia("(min-width:720px)");

  useEffect(() => {
    if (wide.matches) {
      setLayoutType("wide");
    } else if (medium.matches) {
      setLayoutType("medium");
    } else {
      setLayoutType("narrow");
    }
  }, [wide, medium]);

  return (
    <LanguageContext.Provider value={lang}>
      <LayoutTypeContext.Provider value={layoutType}>{props.children}</LayoutTypeContext.Provider>
    </LanguageContext.Provider>
  );
}

export default function App() {
  const [user, setUser] = useState<User | undefined>();
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
    <AppContextWrapper>
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
    </AppContextWrapper>
  );
}
