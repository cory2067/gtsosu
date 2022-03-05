import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { navigate } from "@reach/router";
import { Layout } from "antd";

import "../../utilities.css";
import { prettifyTourney } from "../../utilities";
import ContentManager from "../../ContentManager";
const { Content } = Layout;

export default function Rules({ tourney }) {
  const [data, setData] = useState({});

  useEffect(() => {
    document.title = `${prettifyTourney(tourney)}: Rules`;

    const fetchData = async () => {
      try {
        const data = await ContentManager.get(tourney);
        setData(data);
      } catch {
        return navigate("/404");
      }
    };

    fetchData();
  }, []);

  return (
    <Content className="content">
      <ReactMarkdown source={data.rules} />
    </Content>
  );
}
