import React, { Component } from "react";
import "../../utilities.css";
import { get, post, hasAccess, delet, getStage } from "../../utilities";
import StageSelector from "../modules/StageSelector";
import "./Schedule.css";

import { Layout, Collapse, Form, Input, Select, Button, TimePicker, DatePicker } from "antd";
const { Content } = Layout;
const { Panel } = Collapse;

class Schedule extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stages: [],
      current: [],
    };
  }

  async componentDidMount() {
    const [tourney, current] = await getStage(this.props.tourney);
    this.setState({ stages: tourney.stages, current });
  }

  async componentDidUpdate(prevProps) {
    if (this.props.user._id !== prevProps.user._id) {
      const tourney = await get("/api/tournament", { tourney: this.props.tourney });
      this.setState({ stages: tourney.stages });
    }
  }

  handleMenuClick = ({ key }) => {
    this.setState({ current: { ...this.state.stages[key], index: key } });
  };

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);
  isRef = () =>
    hasAccess(this.props.user, this.props.tourney, [
      "Host",
      "Developer",
      "Referee",
      "Streamer",
      "Commentator",
    ]);

  render() {
    return (
      <Content className="content">
        <div className="u-flex">
          <div className="u-sidebar">
            <StageSelector
              selected={this.state.current.index}
              stages={this.state.stages}
              onClick={this.handleMenuClick}
            />
          </div>
          <div>
            {this.isAdmin() && (
              <Collapse>
                <Panel header={`Add new ${this.state.current.name} match`} key="1">
                  <Form name="basic" onFinish={this.onFinish}>
                    <Form.Item label="Player 1" name="p1">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Player 2" name="p2">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Match Code" name="code">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Match Time" name="time">
                      <DatePicker showTime format={"MM-DD HH:mm"} minuteStep={15} />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        Add
                      </Button>
                    </Form.Item>
                  </Form>
                </Panel>
              </Collapse>
            )}
            <div className="Schedule-list"></div>
          </div>
        </div>
      </Content>
    );
  }
}

export default Schedule;
