import React, { Component } from "react";
import AddMapModal from "../modules/AddMapModal";
import MapCard from "../modules/MapCard";
import { PlusOutlined } from "@ant-design/icons";
import "../../utilities.css";
import { get } from "../../utilities";
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

  componentDidMount() {}

  handleMenuClick = ({ key }) => {
    this.setState({ selected: key });
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
      maps: this.state.maps.concat(this.state.formData),
    });
    get("/api/mapdata", this.state.formData).then((res) => console.log(res));
  };

  handleCancel = (e) => {
    this.setState({
      modal: false,
    });
  };

  handleFormChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  render() {
    return (
      <Content className="content">
        <div className="Mappools-top"></div>
        <div className="u-flex">
          <div className="u-sidebar">
            <Menu theme="dark" selectedKeys={[this.state.selected]} onClick={this.handleMenuClick}>
              <Menu.Item key="qf">Quarterfinals</Menu.Item>
              <Menu.Item key="sf">Semifinals</Menu.Item>
              <Menu.Item key="f">Finals</Menu.Item>
            </Menu>
          </div>

          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            size="large"
            onClick={this.handleAddMap}
          />

          <AddMapModal
            visible={this.state.modal}
            handleOk={this.handleOk}
            handleCancel={this.handleCancel}
            onValuesChange={this.handleFormChange}
          />

          {this.state.maps.map((map) => (
            <MapCard key={map.id} {...map} />
          ))}
        </div>
      </Content>
    );
  }
}

export default Mappools;
