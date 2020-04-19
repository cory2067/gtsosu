import React, { Component } from "react";
import AddMapModal from "../modules/AddMapModal";
import MapCard from "../modules/MapCard";
import { PlusOutlined } from "@ant-design/icons";
import "../../utilities.css";
import { get, post, delet } from "../../utilities";
import "./Mappools.css";

import { Layout, Menu, Button } from "antd";
const { Content } = Layout;

class Mappools extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: "qf",
      modal: false,
      maps: [],
    };
  }

  componentDidMount() {
    this.getMappool(this.state.selected);
  }

  isPooler = () => {
    return this.props.user.username && this.props.user.permissions.includes("pool");
  };

  getMappool(stage) {
    get("/api/maps", { tourney: this.props.tourney, stage: stage }).then((res) => {
      console.log("Got maps: ", res);
      this.setState({
        maps: res,
      });
    });
  }

  handleMenuClick = ({ key }) => {
    this.setState({ selected: key });
    this.getMappool(key);
    console.log(key);
  };

  handleAddMap = () => {
    this.setState({
      modal: true,
    });
  };

  handleOk = (e) => {
    console.log(this.state.formData);
    this.setState({
      modal: false,
    });

    post("/api/map", {
      ...this.state.formData,
      tourney: this.props.tourney,
      stage: this.state.selected,
    })
      .then((res) => {
        this.setState((state) => ({ maps: state.maps.concat(res) }));
      })
      .catch((err) => {
        alert("Could not submit map. Make sure the map ID is correct.");
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
    delet("/api/map", { tourney: this.props.tourney, stage: this.state.selected, id });
  };

  render() {
    return (
      <Content className="content">
        <div className="u-flex">
          <div className="u-sidebar">
            <Menu theme="dark" selectedKeys={[this.state.selected]} onClick={this.handleMenuClick}>
              <Menu.Item key="qf">Quarterfinals</Menu.Item>
              <Menu.Item key="sf">Semifinals</Menu.Item>
              <Menu.Item key="f">Finals</Menu.Item>
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
