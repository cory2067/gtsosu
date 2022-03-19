import React, { Component, useEffect, useState } from "react";
import { navigate, Router } from "@reach/router";
import NotFound from "./pages/NotFound.js";
import Home from "./pages/Home.js";
import Archives from "./pages/Archives.js";
import TourneyHome from "./pages/TourneyHome";
import TourneyStaff from "./pages/TourneyStaff";
import Rules from "./pages/Rules";
import Mappools from "./pages/Mappools";
import Players from "./pages/Players";
import Schedule from "./pages/Schedule";
import Stats from "./pages/Stats";
import PoolHelper from "./pages/PoolHelper";
import Navbar from "./modules/Navbar";
import { get } from "../utilities";

import "../utilities.css";
import YearConfig from "../content/year-config";

import { Layout } from "antd";
import "antd/dist/antd.css";
const { Footer } = Layout;

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
    <>
      <Layout>
        <Navbar attention={loginAttention} user={user} setUser={setUser} />
        <Router primary={false}>
          <Home path="/" />
          <Archives path="/archives" />
          <PoolHelper path="/pool-helper" />

          <TourneyRouteWrapper
            user={user}
            setUser={setUser}
            setLoginAttention={setLoginAttention}
            path="/:tourney/home"
            PageComponent={TourneyHome}
          />
          <TourneyRouteWrapper
            user={user}
            setUser={setUser}
            setLoginAttention={setLoginAttention}
            path="/:year/:tourney/home"
            PageComponent={TourneyHome}
          />

          <TourneyRouteWrapper user={user} path="/:tourney/staff" PageComponent={TourneyStaff} />
          <TourneyRouteWrapper
            user={user}
            path="/:year/:tourney/staff"
            PageComponent={TourneyStaff}
          />

          <TourneyRouteWrapper path="/:tourney/rules" PageComponent={Rules} />
          <TourneyRouteWrapper path="/:year/:tourney/rules" PageComponent={Rules} />

          <TourneyRouteWrapper user={user} path="/:tourney/pools" PageComponent={Mappools} />
          <TourneyRouteWrapper user={user} path="/:year/:tourney/pools" PageComponent={Mappools} />

          <TourneyRouteWrapper user={user} path="/:tourney/players" PageComponent={Players} />
          <TourneyRouteWrapper user={user} path="/:year/:tourney/players" PageComponent={Players} />

          <TourneyRouteWrapper user={user} path="/:tourney/schedule" PageComponent={Schedule} />
          <TourneyRouteWrapper
            user={user}
            path="/:year/:tourney/schedule"
            PageComponent={Schedule}
          />
          <TourneyRouteWrapper user={user} path="/:tourney/stats" PageComponent={Stats} />
          <TourneyRouteWrapper user={user} path="/:year/:tourney/stats" PageComponent={Stats} />

          <NotFound default />
        </Router>
        <Footer></Footer>
      </Layout>
    </>
  );
}

function TourneyRouteWrapper(props) {
  const { PageComponent, year, tourney } = props;

  const tourneyName = tourney.split("-")[0]; // discard division
  const _year = year ?? YearConfig[tourneyName];
  if (!_year) navigate("/404");

  return <PageComponent {...props} tourney={`${tourney}_${_year}`} />;
}
