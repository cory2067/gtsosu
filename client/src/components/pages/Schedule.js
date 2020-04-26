import React, { Component } from "react";
import { get, post, hasAccess, delet, getStage } from "../../utilities";
import "../../utilities.css";
import StageSelector from "../modules/StageSelector";
import SubmitResultsModal from "../modules/SubmitResultsModal";
import { PlusOutlined } from "@ant-design/icons";
import AddTag from "../modules/AddTag";
import "./Schedule.css";

import { Layout, Collapse, Form, Input, Button, Table, DatePicker, Tag } from "antd";
const { Content } = Layout;
const { Panel } = Collapse;
const { Column, ColumnGroup } = Table;

class Schedule extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stages: [],
      current: [],
      match: {},
      matches: [
        {
          key: 0,
          code: "QF2",
          player1: "Cychloryn",
          player2: "Kasumii",
          score1: 6,
          score2: 3,
          time: "SAT 06/22 10:00",
          streamer: "Krekker",
          commentators: ["EMi", "Gamelan4"],
        },
      ],
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

  addReferee = (key) => {
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...m, referee: this.props.user.username };
        }
        return m;
      }),
    }));
  };

  addStreamer = (key) => {
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...m, streamer: this.props.user.username };
        }
        return m;
      }),
    }));
  };

  addCommentator = (key) => {
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...m, commentators: [...m.commentators, this.props.user.username] };
        }
        return m;
      }),
    }));
  };

  removeReferee = (key) => {
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...m, referee: null };
        }
        return m;
      }),
    }));
  };

  removeStreamer = (key) => {
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...m, streamer: null };
        }
        return m;
      }),
    }));
  };

  removeCommentator = (key, i) => {
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          const newComs = [...m.commentators];
          newComs.splice(i, 1);
          return { ...m, commentators: newComs };
        }
        return m;
      }),
    }));
  };

  handleAddResults = (match) => {
    this.setState({ match, visible: true });
  };

  handleValuesChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  handleOk = async () => {
    this.setState({ loading: true });
    // post to server
    this.setState({ loading: false, visible: false });
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === state.match.key) {
          return { ...m, ...state.formData };
        }
        return m;
      }),
    }));
  };

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
                    <Form.Item label="Match ID" name="code">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Match Time" name="time">
                      <DatePicker showTime format={"MM/DD HH:mm"} minuteStep={15} />
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
            <div className="Schedule-list">
              <Table dataSource={this.state.matches}>
                <Column title="Match ID" dataIndex="code" key="code" />
                <Column title="Score" dataIndex="score1" key="score1" />
                <Column title="Player 1" dataIndex="player1" key="player1" />
                <Column title="Player 2" dataIndex="player2" key="player2" />
                <Column title="Score" dataIndex="score2" key="score2" />
                <Column title="Match Time (UTC)" dataIndex="time" key="time" />

                <Column
                  title="Referee"
                  dataIndex="referee"
                  key="referee"
                  render={(r, match) =>
                    r ? (
                      <Tag closable onClose={() => this.removeReferee(match.key)}>
                        {r}
                      </Tag>
                    ) : (
                      <AddTag onClick={() => this.addReferee(match.key)} />
                    )
                  }
                />

                <Column
                  title="Streamer"
                  dataIndex="streamer"
                  key="streamer"
                  render={(r, match) =>
                    r ? (
                      <Tag closable onClose={() => this.removeStreamer(match.key)}>
                        {r}
                      </Tag>
                    ) : (
                      <AddTag onClick={() => this.addStreamer(match.key)} />
                    )
                  }
                />

                <Column
                  title="Commentators"
                  dataIndex="commentators"
                  key="commentators"
                  render={(rs, match) => (
                    <span>
                      {rs.map((r, i) => (
                        <Tag closable onClose={() => this.removeCommentator(match.key, i)} key={r}>
                          {r}
                        </Tag>
                      ))}
                      {!rs.includes(this.props.user.username) && (
                        <AddTag onClick={() => this.addCommentator(match.key)} />
                      )}
                    </span>
                  )}
                />

                <Column title="MP Link" dataIndex="link" key="link" />
                <Column
                  title="Submit"
                  key="submit"
                  className="u-textCenter"
                  render={(_, match) => (
                    <span>
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        size="medium"
                        onClick={() => this.handleAddResults(match)}
                      />
                    </span>
                  )}
                />
              </Table>
            </div>
          </div>
        </div>
        <SubmitResultsModal
          match={this.state.match}
          visible={this.state.visible}
          loading={this.state.loading}
          handleCancel={() => this.setState({ visible: false })}
          handleOk={this.handleOk}
          onValuesChange={this.handleValuesChange}
        />
      </Content>
    );
  }
}

export default Schedule;
