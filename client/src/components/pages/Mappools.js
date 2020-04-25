import React, { Component } from "react";
import AddMapModal from "../modules/AddMapModal";
import MapCard from "../modules/MapCard";
import { PlusOutlined } from "@ant-design/icons";
import "../../utilities.css";
import { get, post, delet, hasAccess } from "../../utilities";
import { navigate } from "@reach/router";
import "./Mappools.css";

import { Layout, Menu, Button, Form, Switch, Input, message } from "antd";
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

  formRef = React.createRef();

  async componentDidMount() {
    const tourney = await get("/api/tournament", { tourney: this.props.tourney });
    if (!tourney.stages || tourney.stages.length === 0) return;

    const curIndex = parseInt(location.hash.substring(1)) || 0; // parse stage from url
    const current = tourney.stages[curIndex] || tourney.stages[0];

    this.setState({ stages: tourney.stages, current: { ...current, index: curIndex } });
    await this.getMappool(current.name);
    if (this.isPooler()) this.formRef.current.setFieldsValue(current);
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
    if (this.isPooler()) this.formRef.current.setFieldsValue(this.state.stages[key]);
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
        message.error("Could not submit map. Make sure the map ID is correct.");
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

  onFinish = async (form) => {
    const index = this.state.current.index;
    const tourney = await post("/api/stage", {
      tourney: this.props.tourney,
      stage: form,
      index,
    });

    this.setState((state) => ({
      stages: tourney.stages,
      current: { ...tourney.stages[state.current.index], index },
    }));
    message.success("Updated pool settings");
  };

  render() {
    return (
      <Content className="content">
        <div className="u-flex">
          <div className="u-sidebar">
            <Menu
              theme="dark"
              selectedKeys={[`${this.state.current.index}`]}
              onClick={this.handleMenuClick}
            >
              {this.state.stages.map((s, i) => (
                <Menu.Item key={i}>
                  <a href={`#${i}`}>{s.name}</a>
                </Menu.Item>
              ))}
            </Menu>

            {this.state.current.mappack && (
              <div className="Mappools-pack">
                <a href={this.state.current.mappack} target="_blank">
                  Download Mappack
                </a>
              </div>
            )}
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

          <div>
            {this.isPooler() && (
              <div className="Mappools-settings">
                <Form ref={this.formRef} onFinish={this.onFinish} layout="inline">
                  <Form.Item name="poolVisible" label="Pool Visible" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="mappack" label="Mappack URL">
                    <Input />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Save
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}

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
        </div>
      </Content>
    );
  }
}

export default Mappools;
