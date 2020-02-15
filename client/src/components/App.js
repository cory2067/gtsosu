import React, { Component } from "react";
import { Router } from "@reach/router";
import NotFound from "./pages/NotFound.js";
import Home from "./pages/Home.js";

import "../utilities.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";

library.add(fab, fas);
/**
 * Define the "App" component as a class.
 */
class App extends Component {
  // makes props available in this component
  constructor(props) {
    super(props);
    this.state = {
      user: undefined,
    };
  }

  componentDidMount() {}

  setUser = (user) => {
    this.setState({ user });
  };

  handleLogout = () => {
    this.setState({ user: undefined });
  };

  render() {
    return (
      <>
        <Router>
          <Home path="/" setUser={this.setUser} logout={this.handleLogout} user={this.state.user} />
          <NotFound default />
        </Router>
      </>
    );
  }
}

export default App;
