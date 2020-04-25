import React, { Component } from "react";
import AddMapModal from "../modules/AddMapModal";
import MapCard from "../modules/MapCard";
import { PlusOutlined } from "@ant-design/icons";
import "../../utilities.css";
import { get, post, delet, hasAccess } from "../../utilities";
import { navigate } from "@reach/router";
import "./Mappools.css";

import { Layout, Menu, Button } from "antd";
const { Content } = Layout;

class Mappools extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      loading: false,
      maps: [],
      stages: [],
      current: {},
    };
  }

  async componentDidMount() {
    const tourney = await get("/api/tournament", { tourney: this.props.tourney });
    if (!tourney.stages || tourney.stages.length === 0) return;

    const curIndex = location.hash.substring(1);
    const current = tourney.stages[curIndex] || tourney.stages[0];

    this.setState({ stages: tourney.stages, current: { ...current, index: curIndex } });
    this.getMappool(current.name);
  }

  isPooler = () =>
    hasAccess(this.props.user, this.props.tourney, ["Host", "Developer", "Mapsetter"]);

  getMappool = async (stage) => {
    const maps = await get("/api/maps", { tourney: this.props.tourney, stage: stage });
    this.setState({
      maps,
    });
  };

  handleMenuClick = ({ key }) => {
    this.setState({ current: { ...this.state.stages[key], index: key } });
    this.getMappool(this.state.stages[key].name);
  };

  handleAddMap = () => {
    this.setState({
      modal: true,
    });
  };

  handleOk = (e) => {
    console.log(this.state.formData);
    this.setState({
      loading: true,
    });

    post("/api/map", {
      ...this.state.formData,
      tourney: this.props.tourney,
      stage: this.state.current.name,
    })
      .then((res) => {
        this.setState((state) => ({ maps: state.maps.concat(res), loading: false, modal: false }));
      })
      .catch((err) => {
        alert("Could not submit map. Make sure the map ID is correct.");
        this.setState({ loading: false });
      });
  };

  handleCancel = (e) => {
    this.setState({
      modal: false,
    });
  };

  handleFormChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  handleDelete = (id) => {
    this.setState((state) => ({
      maps: state.maps.filter((map) => map.mapId != id),
    }));
    delet("/api/map", { tourney: this.props.tourney, stage: this.state.current.name, id });
  };

  render() {
    return (
      <Content className="content">
        <div className="u-flex">
          <div className="u-sidebar">
            <Menu
              theme="dark"
              selectedKeys={[this.state.current.index]}
              onClick={this.handleMenuClick}
            >
              {this.state.stages.map((s, i) => (
                <Menu.Item key={i}>
                  <a href={`#${i}`}>{s.name}</a>
                </Menu.Item>
              ))}
            </Menu>
          </div>

          {this.isPooler() && (
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              size="large"
              onClick={this.handleAddMap}
            />
          )}

          <AddMapModal
            visible={this.state.modal}
            loading={this.state.loading}
            handleOk={this.handleOk}
            handleCancel={this.handleCancel}
            onValuesChange={this.handleFormChange}
          />

          <div className="Mappools-card-container">
            {this.state.maps.map((map) => (
              <MapCard
                key={map._id}
                handleDelete={this.handleDelete}
                isPooler={this.isPooler}
                {...map}
              />
            ))}
          </div>
        </div>
      </Content>
    );
  }
}

export default Mappools;
