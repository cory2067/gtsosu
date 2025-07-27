import { PlusOutlined } from "@ant-design/icons";
import React, { Component } from "react";
import { delet, get, getStage, hasAccess, post, prettifyTourney } from "../../utilities";
import AddMapModal from "../modules/AddMapModal";
import MapCard from "../modules/MapCard";
import StageSelector from "../modules/StageSelector";
import "./Mappools.css";

import { Button, Empty, Form, Input, Layout, Switch, message } from "antd";
import CopyPoolModal from "../modules/CopyPoolModal";
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
      showCopyPoolModal: false,
    };
  }

  formRef = React.createRef();

  async componentDidMount() {
    document.title = `${prettifyTourney(this.props.tourney)}: Mappools`;

    const [tourney, current] = await getStage(this.props.tourney);
    this.setState({ stages: tourney.stages, current, mode: tourney.mode });
    await this.getMappool(current.name);
    if (this.isPooler()) this.formRef.current.setFieldsValue(current);
  }

  async componentDidUpdate(prevProps) {
    // refresh lists on login/logout (this causes some redundant fetches, though)
    if (this.props.user._id !== prevProps.user._id) {
      if (!this.state.current.poolVisible) {
        // pool may become visible once player logs in
        this.getMappool(this.state.current.name);
      }

      const tourney = await get("/api/tournament", { tourney: this.props.tourney });
      this.setState({ stages: tourney.stages });
      if (this.isPooler()) this.formRef.current.setFieldsValue(this.state.current);
    }
  }

  isPooler = () =>
    hasAccess(
      this.props.user,
      this.props.tourney,
      this.state.current.name === "All Stars"
        ? ["Mappooler", "All-Star Mappooler", "Head Pooler", "Mapper"]
        : ["Mappooler", "Head Pooler", "Mapper"]
    );

  sortMaps = (maps) => {
    const mods = { NM: 0, HD: 1, HR: 2, DT: 3, FM: 4, HT: 5, HDHR: 6, TB: 7 };
    return maps.sort((a, b) => {
      if (mods[a.mod] - mods[b.mod] != 0) {
        return mods[a.mod] - mods[b.mod];
      }
      return a.index - b.index;
    });
  };

  getMappool = async (stage) => {
    if (!stage) return this.setState({ maps: [] });

    try {
      const maps = await get("/api/maps", { tourney: this.props.tourney, stage: stage });
      this.setState({
        maps,
      });
    } catch (e) {
      // probably user tried to view an unreleased pool
      this.setState({ maps: [] });
    }
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
    this.setState({
      loading: true,
    });

    post("/api/map", {
      ...this.state.formData,
      tourney: this.props.tourney,
      stage: this.state.current.name,
      mode: this.state.mode,
    })
      .then((res) => {
        this.setState((state) => ({
          maps: this.sortMaps(state.maps.concat(res)),
          loading: false,
          modal: false,
        }));
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
      maps: state.maps.filter((map) => map._id !== id),
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

  handleStartCopyPool = () => this.setState({ showCopyPoolModal: true });
  handleSubmitCopyPool = async (toStage) => {
    await post("/api/copy-pool", {
      tourney: this.props.tourney,
      fromStage: this.state.current.name,
      toStage: toStage,
    });
    this.setState({
      showCopyPoolModal: false,
    });
  };

  render() {
    return (
      <Content className="content">
        <div className="u-flex">
          <div className="u-sidebar">
            <StageSelector
              selected={this.state.current.index}
              onClick={this.handleMenuClick}
              stages={this.state.stages}
            />

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
            user={this.props.user}
            visible={this.state.modal}
            loading={this.state.loading}
            handleOk={this.handleOk}
            handleCancel={this.handleCancel}
            onValuesChange={this.handleFormChange}
          />

          <CopyPoolModal
            visible={this.state.showCopyPoolModal}
            loading={this.state.loading}
            handleOk={this.handleSubmitCopyPool}
            handleCancel={() => this.setState({ showCopyPoolModal: false })}
            stages={this.state.stages}
            fromStage={this.state.current}
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
                  <Form.Item>
                    <a target="_blank" href="/pool-helper">
                      <Button>Pool Helper</Button>
                    </a>
                  </Form.Item>
                  <Form.Item>
                    <Button onClick={this.handleStartCopyPool}>Copy Pool</Button>
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
            {this.state.maps.length === 0 && (
              <div className="Mappools-empty">
                <Empty description="No maps" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </div>
        </div>
      </Content>
    );
  }
}

export default Mappools;
