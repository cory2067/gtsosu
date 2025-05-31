import { navigate } from "@reach/router";
import { Layout } from "antd";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import ContentManager, { contentManager } from "../../ContentManager";
import { prettifyTourney } from "../../utilities";
const { Content } = Layout;

export default function Rules({ tourney }) {
  const [data, setData] = useState({});
  const lang = useContext(LanguageContext);

  useEffect(() => {
    document.title = `${prettifyTourney(tourney)}: Rules`;

    const fetchData = async () => {
      try {
        const data = await contentManager.getLocalizedTourney(tourney, lang);
        setData(data);
      } catch {
        return navigate("/404");
      }
    };

    fetchData();
  }, [lang]);

  return (
    <Content className="content">
      <ReactMarkdown source={data.rules} />
    </Content>
  );
}
