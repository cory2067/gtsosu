import { Link } from "@reach/router";
import React, { useEffect, useState } from "react";
import { get, prettifyTourney, tokenizeTourney } from "../../utilities";
import "./Archives.css";

import { Layout, List } from "antd";
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
              <div className="Archives-entry-wrapper">
                <Link to={`/${tourney.year}/${tourney.codeAndDivision}/home`}>
                  <span className="Archives-entry">{tourney.displayName}</span>
                </Link>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Content>
  );
}

export default Archives;
