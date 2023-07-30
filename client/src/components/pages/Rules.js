import { navigate } from "@reach/router";
import { Layout } from "antd";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import ContentManager from "../../ContentManager";
import { prettifyTourney } from "../../utilities";
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
