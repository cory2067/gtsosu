import React, { Component } from "react";
import { Router } from "@reach/router";
import NotFound from "./pages/NotFound.js";
import Home from "./pages/Home.js";
import Staff from "./pages/Staff.js";
import TourneyHome from "./pages/TourneyHome";
import TourneyStaff from "./pages/TourneyStaff";
import Rules from "./pages/Rules";
import Mappools from "./pages/Mappools";
import Players from "./pages/Players";
import Schedule from "./pages/Schedule";
import Navbar from "./modules/Navbar";
import { get } from "../utilities";

import "../utilities.css";

import { Layout } from "antd";
import "antd/dist/antd.css";
const { Footer } = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { user: {} };
  }

  componentDidMount() {
    get("/api/whoami").then((res) => {
      this.setState({ user: res });
    });
  }

  updateUser = (user) => {
    this.setState({ user });
  };

  render() {
    return (
      <>
        <Layout>
          <Navbar user={this.state.user} updateUser={this.updateUser} />
          <Router primary={false}>
            <Home path="/" />
            <Staff path="/staff" />
            <TourneyHome user={this.state.user} path="/:tourney/home" />
            <TourneyStaff path="/:tourney/staff" />
            <Rules path="/:tourney/rules" />
            <Mappools user={this.state.user} path="/:tourney/pools" />
            <Players user={this.state.user} path="/:tourney/players" />
            <Schedule path="/:tourney/schedule" />
            <NotFound default />
          </Router>
          <Footer></Footer>
        </Layout>
      </>
    );
  }
}

export default App;
