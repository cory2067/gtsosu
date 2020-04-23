import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import TourneyCard from "../modules/TourneyCard";
import "../../utilities.css";
import "./Home.css";

import data from "../../content/home-en";
import { Layout, Card } from "antd";
const { Content } = Layout;

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return (
      <Content className="content">
        <h1 className="Home-title">{data.title}</h1>
        <div className="Home-about-container">
          <div className="Home-about">
            <ReactMarkdown source={data.description} />
          </div>
        </div>

        <div className="Home-container">
          {data.tournies.map((tourney) => (
            <TourneyCard key={tourney.code} {...tourney} />
          ))}
        </div>
      </Content>
    );
  }
}

export default Home;
