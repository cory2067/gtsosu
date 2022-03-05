import React, { useEffect, useState } from "react";
import { Link } from "@reach/router";
import ReactMarkdown from "react-markdown";
import TourneyCard from "../modules/TourneyCard";
import { get, hasAccess, delet, post, prettifyTourney, tokenizeTourney } from "../../utilities";
import "../../utilities.css";
import "./PoolHelper.css";

import { Layout, Card, List, Form, Select, Input, InputNumber, Button } from "antd";
import StageSelector from "../modules/StageSelector";
const { Content } = Layout;

function PoolHelper(props) {
  const [history, setHistory] = useState();

  const search = async (form) => {
    const res = await get("/api/map-history", { id: form.id });
    setHistory(res);
  };

  const renderMap = (map) => {
    const { codeAndDivision, year } = tokenizeTourney(map.tourney);
    const tourney = `${codeAndDivision.toUpperCase()} ${year}`;
    return (
      <List.Item>
        <a target="_blank" href={`https://osu.ppy.sh/b/${map.mapId}`}>
          {`${tourney}: ${map.stage} ${map.mod}${map.index} (${map.diff}, ${map.creator} mapset)`}
        </a>
      </List.Item>
    );
  };

  return (
    <Content className="content">
      <h1>Pool Helper</h1>
      <div className="PoolHelper-container">
        <Form layout="inline" onFinish={search}>
          <Form.Item name="id" label="Map ID">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Search
            </Button>
          </Form.Item>
        </Form>

        <br />
        {history && (
          <div class={"PoolHelper-header u-bottom-pad"}>
            {history.mapData.artist} - {history.mapData.title}
          </div>
        )}

        {history && history.sameDiff.length > 0 && (
          <List
            header={<div className="PoolHelper-header">Same diff was used</div>}
            bordered
            dataSource={history.sameDiff}
            renderItem={renderMap}
          />
        )}

        {history && history.sameSet.length > 0 && (
          <List
            header={
              <div className="PoolHelper-header">Same mapset (but different diff) was used</div>
            }
            bordered
            dataSource={history.sameSet}
            renderItem={renderMap}
          />
        )}

        {history && history.sameSong.length > 0 && (
          <List
            header={<div className="PoolHelper-header">Same song (but different set) was used</div>}
            bordered
            dataSource={history.sameSong}
            renderItem={renderMap}
          />
        )}

        {history &&
          !history.sameDiff.length &&
          !history.sameSet.length &&
          !history.sameSong.length && <div>This song has never been used!</div>}
      </div>
    </Content>
  );
}

export default PoolHelper;
