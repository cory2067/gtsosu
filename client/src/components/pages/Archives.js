import React, { useEffect, useState } from "react";
import { Link } from "@reach/router";
import ReactMarkdown from "react-markdown";
import TourneyCard from "../modules/TourneyCard";
import { get, hasAccess, delet, post, prettifyTourney, tokenizeTourney } from "../../utilities";
import "./Archives.css";

import data from "../../content/home-en";
import { Layout, Card, List } from "antd";
const { Content } = Layout;

function Archives(props) {
  const [tourneys, setTourneys] = useState([]);

  useEffect(() => {
    get("/api/tourneys", {}).then((res) => {
      const tourneyList = res
        .map((tourney) => {
          const tokens = tokenizeTourney(tourney.code);
          return {
            _id: tourney._id,
            displayName: prettifyTourney(tourney.code),
            ...tokens,
          };
        })
        .filter((t) => t.code !== "test")
        .reverse()
        .sort((a, b) => b.year - a.year);

      setTourneys(tourneyList);
    });
  }, []);

  return (
    <Content className="content">
      <h1>Tournament Archives</h1>
      <div className="Archives-container">
        <List
          dataSource={tourneys}
          size="large"
          bordered
          loading={!tourneys.length}
          renderItem={(tourney) => (
            <List.Item key={tourney._id}>
              <Link to={`/${tourney.year}/${tourney.codeAndDivision}/home`}>
                <span className="Archives-entry">{tourney.displayName}</span>
              </Link>
            </List.Item>
          )}
        />
      </div>
    </Content>
  );
}

export default Archives;
