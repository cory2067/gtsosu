import React, { Component } from "react";
import { get, post, hasAccess, delet, getStage, prettifyTourney } from "../../utilities";
import "../../utilities.css";
import StageSelector from "../modules/StageSelector";
import SubmitResultsModal from "../modules/SubmitResultsModal";
import FlagIcon from "../modules/FlagIcon";
import { PlusOutlined, LinkOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";
import AddTag from "../modules/AddTag";
import Qualifiers from "../modules/Qualifiers";
import SubmitWarmupModal from "../modules/SubmitWarmupModal";
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
  Select,
  Radio,
} from "antd";
import { UserAuth } from "../../permissions/UserAuth";
import { UserRole } from "../../permissions/UserRole";

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
      timezone: 0,
      show: "all",
      editing: -1,
      formData: {
        score1: 0,
        score2: 0,
        link: "",
      },
      warmupFormData: {
        warmup: "",
        match: "",
        playerNo: 0,
      },
      submitWarmupVisible: false,
      submitWarmupLoading: false,
    };
  }

  async componentDidMount() {
    document.title = `${prettifyTourney(this.props.tourney)}: Schedule`;
    const [tourney, current] = await getStage(this.props.tourney);
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

  // perms controls
  isAdmin = () => hasAccess(this.props.user, this.props.tourney, []);
  isRef = () => hasAccess(this.props.user, this.props.tourney, ["Referee"]);
  isStreamer = () => hasAccess(this.props.user, this.props.tourney, ["Streamer"]);
  isCommentator = () => hasAccess(this.props.user, this.props.tourney, ["Commentator"]);
  canSubmitWarmup = (match, playerNo) => {
    if (!this.props.user) return false;

    // Admin can always edit
    if (this.isAdmin()) return true;

    // Players can't edit if the match is in less than 1 hour
    if (new Date(match.time) - Date.now() < 3600000) return false;

    return new UserAuth(this.props.user)
      .forMatch(match, playerNo, this.state.teams ? this.state.lookup : undefined)
      .hasAnyRole([UserRole.Captain]);
  };

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

  add = async (role, key, optionalUser) => {
    const user = optionalUser ?? prompt("Enter a username");

    const newMatch = await post(`/api/${role}`, { match: key, user, tourney: this.props.tourney });
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
    const newMatch = await delet(`/api/${role}`, { match: key, user, tourney: this.props.tourney });
    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === key) {
          return { ...newMatch, key: newMatch._id };
        }
        return m;
      }),
    }));
  };

  addReferee = (key, user) => this.add("referee", key, user);
  addStreamer = (key, user) => this.add("streamer", key, user);
  addCommentator = (key, user) => this.add("commentator", key, user);
  removeReferee = (key, user) => this.remove("referee", key, user);
  removeStreamer = (key, user) => this.remove("streamer", key, user);
  removeCommentator = (key, user) => this.remove("commentator", key, user);

  handleAddResults = (match) => {
    this.setState({ match, visible: true });
  };

  handleDelete = async (match) => {
    await delet("/api/match", { match: match._id, tourney: this.props.tourney });
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
      tourney: this.props.tourney,
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

  handleSubmitWarmup = async (match, playerNo, warmupMap) => {
    this.setState({ submitWarmupLoading: true });

    try {
      const newMatch = await post("/api/warmup", {
        match: match,
        playerNo,
        warmup: warmupMap,
      });

      this.setState((state) => ({
        matches: state.matches.map((m) => {
          if (m.key === newMatch._id) {
            return { ...newMatch, key: newMatch._id };
          }
          return m;
        }),
        submitWarmupVisible: false,
        submitWarmupLoading: false,
      }));
      message.success("Warmup submitted successfully");
    } catch (e) {
      message.error(e.message || e);
      this.setState({ submitWarmupVisible: false, submitWarmupLoading: false });
    }
  };

  handleDeleteWarmup = async (match, playerNo) => {
    const newMatch = await delet("/api/warmup", {
      match: match,
      playerNo,
    });

    this.setState((state) => ({
      matches: state.matches.map((m) => {
        if (m.key === newMatch._id) {
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
  getStats = (name) => {
    const info = this.getInfo(name);
    if (!info.stats) return info;
    const stats = info.stats.filter((s) => s.tourney === this.props.tourney)[0];
    return stats || {};
  };

  renderName = (p) => {
    if (p.startsWith("Winner of ")) {
      const code = p.split("Winner of ")[1];
      const match = this.state.matches.filter((match) => match.code === code)[0];
      if (!match || match.score1 === match.score2) {
        // no winner of the match yet, just display "Winner of X"
        return (
          <span className="Players-name">
            <FlagIcon size={14} />
            {p}
          </span>
        );
      }

      // may recurse through several match references
      if (match.score1 > match.score2) {
        return this.renderName(match.player1);
      }
      return this.renderName(match.player2);
    }

    const stats = this.getStats(p);

    const title =
      stats && stats.seedName && stats.seedNum ? `${stats.seedName} Seed (#${stats.seedNum})` : "";

    return (
      <Tooltip title={title}>
        <span className="Players-name">
          <FlagIcon size={14} code={this.getInfo(p).country} customIcon={this.getInfo(p).icon} />
          {p}
        </span>
      </Tooltip>
    );
  };

  renderWarmup = (url, match, playerNo) => {
    const canEdit = this.canSubmitWarmup(match, playerNo);
    if (url) {
      return (
        <>
          <a target="_blank" href={url}>
            <LinkOutlined className="Schedule-link" />
          </a>
          {canEdit && (
            <DeleteOutlined
              className="Schedule-link"
              onClick={() => this.handleDeleteWarmup(match, playerNo)}
              style={{ marginLeft: 12 }}
            />
          )}
        </>
      );
    } else if (canEdit) {
      return (
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="medium"
          onClick={() =>
            this.setState({
              warmupFormData: {
                ...this.state.warmupFormData,
                match: match._id,
                playerNo,
              },
              submitWarmupVisible: true,
            })
          }
        />
      );
    }
  };

  handleTimezone = (e) => {
    if (this.state.editing > -1) return;
    this.setState({ timezone: e.target.value });
  };

  handleFilter = (e) => {
    this.setState({ show: e.target.value });
  };

  utcString = (timezone) => {
    if (timezone === 0) return "UTC";
    if (timezone < 0) return `UTC${timezone}`;
    return `UTC+${timezone}`;
  };

  getTeam = (playerName) => {
    if (!this.state.teams) return null;
    return Object.values(this.state.lookup).filter((team) =>
      team.players.some((p) => p.username === playerName)
    )[0];
  };

  startEdit = (i) => {
    if (!this.isAdmin()) return;
    this.setState({
      timezone: 0,
      editing: i,
    });
  };

  onEdit = async (val, i) => {
    const time = this.stripTimezone(val.seconds(0).toString());
    const newMatch = await post("/api/reschedule", {
      match: this.state.matches[i]._id,
      tourney: this.props.tourney,
      time,
    });
    newMatch.key = newMatch._id;

    this.setState((state) => ({
      editing: -1,
      matches: state.matches.map((m, index) => (index === i ? newMatch : m)),
    }));
  };

  render() {
    let matches = this.state.matches;
    if (this.state.show === "mine" && this.props.user._id) {
      const me = this.state.teams
        ? (this.getTeam(this.props.user.username) || {}).name
        : this.props.user.username;

      matches = matches.filter(
        (m) =>
          m.player1 === me ||
          m.player2 === me ||
          m.referee === this.props.user.username ||
          m.streamer === this.props.user.username ||
          m.commentators.includes(this.props.user.username)
      );
    }

    const username = this.props.user.username;
    const quals = this.state.current.name === "Qualifiers";

    return (
      <Content className="content">
        <div className="u-flex">
          <div className="u-sidebar">
            {this.props.user._id && this.props.user.timezone !== 0 && (
              <div className="Schedule-timezone">
                <span>Display times in:</span>
                <Radio.Group value={this.state.timezone} onChange={this.handleTimezone}>
                  <Radio.Button value={0}>UTC</Radio.Button>
                  <Radio.Button value={this.props.user.timezone}>
                    {this.utcString(this.props.user.timezone)}
                  </Radio.Button>
                </Radio.Group>
              </div>
            )}

            <StageSelector
              selected={this.state.current.index}
              stages={this.state.stages}
              onClick={this.handleMenuClick}
            />

            {this.props.user._id && !quals && (
              <div className="Schedule-filter">
                <span>Matches shown:</span>
                <Radio.Group value={this.state.show} onChange={this.handleFilter}>
                  <Radio.Button value="all">All</Radio.Button>
                  <Radio.Button value="mine">Mine</Radio.Button>
                </Radio.Group>
              </div>
            )}
          </div>
          <div>
            {quals ? (
              <Qualifiers
                {...this.props}
                stripTimezone={this.stripTimezone}
                isAdmin={this.isAdmin}
                isRef={this.isRef}
                teams={this.state.teams}
                getTeam={this.getTeam}
                getInfo={this.getInfo}
                timezone={this.state.timezone}
                utcString={this.utcString}
                currentStage={this.state.current}
              />
            ) : (
              <>
                {this.isAdmin() && this.state.current.name && (
                  <Collapse>
                    <Panel header={`Add new ${this.state.current.name} match`} key="1">
                      <Form name="basic" onFinish={this.onFinish}>
                        <Form.Item label={this.state.teams ? "Team 1" : "Player 1"} name="player1">
                          <Select showSearch>
                            {Object.keys(this.state.lookup).map((name) => (
                              <Select.Option key={name} value={name}>
                                {name}
                              </Select.Option>
                            ))}
                            {this.state.matches
                              .map((match) => `Winner of ${match.code}`)
                              .map((name) => (
                                <Select.Option key={name} value={name}>
                                  {name}
                                </Select.Option>
                              ))}
                          </Select>
                        </Form.Item>
                        <Form.Item label={this.state.teams ? "Team 2" : "Player 2"} name="player2">
                          <Select showSearch>
                            {Object.keys(this.state.lookup).map((name) => (
                              <Select.Option key={name} value={name}>
                                {name}
                              </Select.Option>
                            ))}
                            {this.state.matches
                              .map((match) => `Winner of ${match.code}`)
                              .map((name) => (
                                <Select.Option key={name} value={name}>
                                  {name}
                                </Select.Option>
                              ))}
                          </Select>
                        </Form.Item>
                        <Form.Item label="Match ID" name="code">
                          <Input />
                        </Form.Item>
                        <Form.Item label="Match Time (UTC)" name="time">
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
                  <Table dataSource={matches} pagination={false}>
                    {this.state.current.name === "Group Stage" && (
                      <Column
                        title="Group"
                        dataIndex="player1"
                        key="group"
                        render={(t) => <span className="u-bold">{this.getStats(t).group}</span>}
                      />
                    )}

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
                      title="Warmup 1"
                      dataIndex="warmup1"
                      key="warmup1"
                      className="u-textCenter"
                      render={(url, match) => {
                        return this.renderWarmup(url, match, 1);
                      }}
                    />
                    <Column
                      title={this.state.teams ? "Team 2" : "Player 2"}
                      dataIndex="player2"
                      key="player2"
                      render={this.renderName}
                    />
                    <Column
                      title="Warmup 2"
                      dataIndex="warmup2"
                      key="warmup2"
                      className="u-textCenter"
                      render={(url, match) => {
                        return this.renderWarmup(url, match, 2);
                      }}
                    />

                    <Column
                      title="Score"
                      dataIndex="score2"
                      key="score2"
                      render={(s, match) => this.displayScore(s, match.score1)}
                    />
                    <Column
                      title={
                        <span>
                          {"Match Time "}
                          <span className="u-bold">({this.utcString(this.state.timezone)})</span>
                        </span>
                      }
                      dataIndex="time"
                      key="time"
                      render={(t, _, i) =>
                        this.state.editing === i ? (
                          <DatePicker
                            defaultValue={moment(t).utcOffset(0)}
                            onChange={(val) => this.onEdit(val, i)}
                            showTime
                            format={"MM/DD HH:mm"}
                            minuteStep={15}
                          />
                        ) : (
                          <span
                            className={this.isAdmin() ? "u-pointer" : ""}
                            onClick={() => this.startEdit(i)}
                          >
                            {moment(t).utcOffset(this.state.timezone).format("ddd MM/DD HH:mm")}
                          </span>
                        )
                      }
                    />

                    <Column
                      title="Referee"
                      dataIndex="referee"
                      key="referee"
                      render={(r, match) =>
                        r ? (
                          <Tag
                            closable={this.isRef()}
                            onClose={() => this.removeReferee(match.key, r)}
                          >
                            {r}
                          </Tag>
                        ) : (
                          <>
                            {this.isRef() && (
                              <AddTag onClick={() => this.addReferee(match.key, username)} />
                            )}
                            {this.isAdmin() && (
                              <AddTag
                                text="Add someone"
                                onClick={() => this.addReferee(match.key)}
                              />
                            )}
                          </>
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
                            closable={this.isStreamer()}
                            onClose={() => this.removeStreamer(match.key)}
                          >
                            {r}
                          </Tag>
                        ) : (
                          <>
                            {this.isStreamer() && (
                              <AddTag onClick={() => this.addStreamer(match.key, username)} />
                            )}
                            {this.isAdmin() && (
                              <AddTag
                                text="Add someone"
                                onClick={() => this.addStreamer(match.key)}
                              />
                            )}
                          </>
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
                              closable={this.isCommentator()}
                              onClose={() => this.removeCommentator(match.key, r)}
                              key={r}
                            >
                              {r}
                            </Tag>
                          ))}
                          {this.isCommentator() && !rs.includes(username) && (
                            <AddTag onClick={() => this.addCommentator(match.key, username)} />
                          )}
                          {this.isAdmin() && (
                            <AddTag
                              text="Add someone"
                              onClick={() => this.addCommentator(match.key)}
                            />
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
        <SubmitWarmupModal
          visible={this.state.submitWarmupVisible}
          handleCancel={() => this.setState({ submitWarmupVisible: false })}
          onValuesChange={(values) =>
            this.setState({ warmupFormData: { ...this.state.warmupFormData, ...values } })
          }
          handleOk={() =>
            this.handleSubmitWarmup(
              this.state.warmupFormData.match,
              this.state.warmupFormData.playerNo,
              this.state.warmupFormData.warmup
            )
          }
          loading={this.state.submitWarmupLoading}
        />
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
