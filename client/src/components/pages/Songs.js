import React, { useState, useEffect } from "react";
import { get } from "../../utilities";
import MapCard from "../modules/MapCard";
import { Layout } from "antd";
const { Content } = Layout;

export default function Songs() {
  const [state, setState] = useState({
    maps: [],
  });
  
  useEffect(() => {
    get("/api/custom-songs", {}).then((maps) => {
      setState({ ...state, maps });
    });
  }, []);
  
  return (
    <Content className="content">
      <div className="Mappools-card-container">
        {state.maps && state.maps.map((map) => (
          <MapCard key={map._id} isPooler={() => false} showTourney={true} {...map} />
        ))}
      </div>
    </Content>
  );
}