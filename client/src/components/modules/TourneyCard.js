import React from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@reach/router";

import { Card, List } from "antd";
import "./TourneyCard.css";

export default function TourneyCard({ divisions, code, title, description }) {
  const hasDivisions = !!divisions;

  return (
    <Card
      title={title}
      bordered={true}
      extra={!hasDivisions && <Link to={`/${code}/home`}>Visit Tourney</Link>}
      className="TourneyCard-card"
    >
      <ReactMarkdown source={description} />

      {hasDivisions && (
        <List
          size="small"
          header={<div>Divisions</div>}
          bordered
          dataSource={divisions}
          renderItem={({ tourneyTitle, tourneyCode }) => (
            <List.Item>
              <Link to={`/${tourneyCode}-${code}/home`}>{tourneyTitle}</Link>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
