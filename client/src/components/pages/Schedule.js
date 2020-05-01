import React, { Component } from "react";
import { get, post, hasAccess, delet, getStage } from "../../utilities";
import "../../utilities.css";
import StageSelector from "../modules/StageSelector";
import SubmitResultsModal from "../modules/SubmitResultsModal";
import FlagIcon from "../modules/FlagIcon";
import { PlusOutlined, LinkOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";
import AddTag from "../modules/AddTag";
import Qualifiers from "../modules/Qualifiers";
import "./Schedule.css";

import {
  Layout,
  Collapse,
  Form,
  Input,
  Button,
  Table,
  DatePicker,
  Tag,
  message,
  Tooltip,
} from "antd";

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
      lookup: {},
      matches: [],
    };
  }

  async componentDidMount() {
    document.title = `${this.props.tourney.toUpperCase()}: Schedule`;
    const [tourney, current] = await getStage(this.props.tourney);
    if (!current.name) return message.warning("No matches have been scheduled yet!");
    this.getMatches(current.name);
    this.setState({
      stages: tourney.stages,
      teams: tourney.teams,
      current,
    });

    const participants = await (tourney.teams
      ? get("/api/teams", { tourney: this.props.tourney })
      : get("/api/players", { tourney: this.props.tourney }));
    const lookup = Object.fromEntries(participants.map((p) => [p.name || p.username, p]));
    this.setState({ lookup });
    console.log(lookup);
  }

  async componentDidUpdate(prevProps) {
    if (this.props.user._id !== prevProps.user._id) {
      const [tourney, current] = await getStage(this.props.tourney);

      if (this.state.current._id !== current._id) {
        this.getMatches(current.name);
      }

      this.setState({ stages: tourney.stages, current });
    }
  }

  async getMatches(stage) {
    const matches = await get("/api/matches", {
      tourney: this.props.tourney,
      stage: stage,
    });
    this.setState({ matches: matches.map((m) => ({ ...m, key: m._id })) });
  }

  handleMenuClick = ({ key }) => {
    this.setState({ current: { ...this.state.stages[key], index: key } });
    this.getMatches(this.state.stages[key].name);
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

  // janky way to nuke the timezone, forcing UTC time
  stripTimezone = (time) => time.toString().split("GMT")[0] + "GMT";

  onFinish = async (matchData) => {
    matchData.time = this.stripTimezone(matchData.time);

    const newMatch = await post("/api/match", {
      ...matchData,
      tourney: this.props.tourney,
      stage: this.state.current.name,
    });

    this.setState((state) => ({
      matches: [...state.matches, { ...newMatch, key: newMatch._id }],
    }));
  };

  add = async (role, key) => {
    const newMatch = await post(`/api/${role}`, { match: key });
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...newMatch, key: newMatch._id };
        }
        return m;
      }),
    }));
  };

  // user is optional (only used for commentator)
  remove = async (role, key, user) => {
    const newMatch = await delet(`/api/${role}`, { match: key, user });
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...newMatch, key: newMatch._id };
        }
        return m;
      }),
    }));
  };

  addReferee = (key) => this.add("referee", key);
  addStreamer = (key) => this.add("streamer", key);
  addCommentator = (key) => this.add("commentator", key);
  removeReferee = (key) => this.remove("referee", key);
  removeStreamer = (key) => this.remove("streamer", key);
  removeCommentator = (key, user) => this.remove("commentator", key, user);

  handleAddResults = (match) => {
    this.setState({ match, visible: true });
  };

  handleDelete = async (match) => {
    await delet("/api/match", { match: match._id });
    this.setState((state) => ({
      matches: state.matches.filter((m) => m.key !== match.key),
    }));
  };

  handleValuesChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  handleOk = async () => {
    this.setState({ loading: true });
    const newMatch = await post("/api/results", {
      ...this.state.formData,
      match: this.state.match._id,
    });

    this.setState((state) => ({
      loading: false,
      visible: false,
      matches: state.matches.map((m) => {
        if (m.key === state.match.key) {
          return { ...newMatch, key: newMatch._id };
        }
        return m;
      }),
    }));
  };

  displayScore = (score, other) => {
    if (score === -2) {
      return <span>--</span>;
    }
    if (score === -1) {
      return <span>FF</span>;
    }
    if (score > other) {
      return <span className="u-bold">{score}</span>;
    }
    return <span>{score}</span>;
  };

  getInfo = (name) => this.state.lookup[name] || {};

  renderName = (p) => (
    <Tooltip title={`${this.getInfo(p).seedName} seed (#${this.getInfo(p).seedNum})`}>
      <span className="Players-name">
        <FlagIcon size={14} code={this.getInfo(p).country} />
        {p}
      </span>
    </Tooltip>
  );

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
            {this.state.current.name === "Qualifiers" ? (
              <Qualifiers
                {...this.props}
                stripTimezone={this.stripTimezone}
                isAdmin={this.isAdmin}
                isRef={this.isRef}
                teams={this.state.teams}
                getInfo={this.getInfo}
              />
            ) : (
              <>
                {this.isAdmin() && this.state.current.name && (
                  <Collapse>
                    <Panel header={`Add new ${this.state.current.name} match`} key="1">
                      <Form name="basic" onFinish={this.onFinish}>
                        <Form.Item label={this.state.teams ? "Team 1" : "Player 1"} name="player1">
                          <Input />
                        </Form.Item>
                        <Form.Item label={this.state.teams ? "Team 2" : "Player 2"} name="player2">
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
                    <Column
                      title="Score"
                      dataIndex="score1"
                      key="score1"
                      render={(s, match) => this.displayScore(s, match.score2)}
                    />
                    <Column
                      title={this.state.teams ? "Team 1" : "Player 1"}
                      dataIndex="player1"
                      key="player1"
                      render={this.renderName}
                    />
                    <Column
                      title={this.state.teams ? "Team 2" : "Player 2"}
                      dataIndex="player2"
                      key="player2"
                      render={this.renderName}
                    />

                    <Column
                      title="Score"
                      dataIndex="score2"
                      key="score2"
                      render={(s, match) => this.displayScore(s, match.score1)}
                    />
                    <Column
                      title="Match Time (UTC)"
                      dataIndex="time"
                      key="time"
                      render={(t) => moment(t).utcOffset(0).format("ddd MM/DD HH:mm")}
                    />

                    <Column
                      title="Referee"
                      dataIndex="referee"
                      key="referee"
                      render={(r, match) =>
                        r ? (
                          <Tag
                            closable={this.isRef()}
                            onClose={() => this.removeReferee(match.key)}
                          >
                            {r}
                          </Tag>
                        ) : (
                          this.isRef() && <AddTag onClick={() => this.addReferee(match.key)} />
                        )
                      }
                    />

                    <Column
                      title="Streamer"
                      dataIndex="streamer"
                      key="streamer"
                      render={(r, match) =>
                        r ? (
                          <Tag
                            closable={this.isRef()}
                            onClose={() => this.removeStreamer(match.key)}
                          >
                            {r}
                          </Tag>
                        ) : (
                          this.isRef() && <AddTag onClick={() => this.addStreamer(match.key)} />
                        )
                      }
                    />

                    <Column
                      title="Commentators"
                      dataIndex="commentators"
                      key="commentators"
                      render={(rs, match) => (
                        <span>
                          {rs.map((r) => (
                            <Tag
                              closable={this.isRef()}
                              onClose={() => this.removeCommentator(match.key, r)}
                              key={r}
                            >
                              {r}
                            </Tag>
                          ))}
                          {this.isRef() && !rs.includes(this.props.user.username) && (
                            <AddTag onClick={() => this.addCommentator(match.key)} />
                          )}
                        </span>
                      )}
                    />

                    <Column
                      title="MP Link"
                      dataIndex="link"
                      key="link"
                      className="u-textCenter"
                      render={(url) =>
                        url && (
                          <a target="_blank" href={url}>
                            <LinkOutlined className="Schedule-link" />
                          </a>
                        )
                      }
                    />

                    {this.isRef() && (
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
                    )}

                    {this.isAdmin() && (
                      <Column
                        title="Delete"
                        key="submit"
                        className="u-textCenter"
                        render={(_, match) => (
                          <span>
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<DeleteOutlined />}
                              size="medium"
                              onClick={() => this.handleDelete(match)}
                            />
                          </span>
                        )}
                      />
                    )}
                  </Table>
                </div>
              </>
            )}
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
