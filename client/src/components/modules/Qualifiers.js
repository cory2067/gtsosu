import React, { Component } from "react";
import { Collapse, Form, Button, Table, DatePicker, Tag } from "antd";
import moment from "moment";
import AddTag from "../modules/AddTag";
const { Panel } = Collapse;
import { DeleteOutlined } from "@ant-design/icons";
import { get, post, delet, hasAccess } from "../../utilities";
const { Column } = Table;

class Qualifiers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lobbies: [],
    };
  }

  componentDidMount() {
    this.getLobbies();
  }

  async getLobbies() {
    const lobbies = await get("/api/lobbies", {
      tourney: this.props.tourney,
    });
    this.setState({ lobbies: lobbies.map((m) => ({ ...m, key: m._id })) });
  }

  isStaff = () => hasAccess(this.props.user, this.props.tourney, ["Referee", "Mapsetter"]);

  canRegister(lobby) {
    if (!this.props.user._id) return false;
    if (this.isStaff()) return false;
    if (lobby.length >= 8) return false; // indiv. limit
    if (!this.props.teams) {
      return this.state.lobbies.every((lobby) => !lobby.players.includes(this.props.user.username));
    }

    if (lobby.length >= 4) return false; // team limit
    const myTeam = this.props.getTeam(this.props.user.username);
    if (!myTeam) return false;

    const isCaptain = myTeam.players[0].username === this.props.user.username;
    if (!isCaptain) return false;

    return this.state.lobbies.every((lobby) => lobby.players.every((team) => team !== myTeam.name));
  }

  onFinish = async (lobbyData) => {
    lobbyData.time = this.props.stripTimezone(lobbyData.time);

    const newLobby = await post("/api/lobby", {
      time: lobbyData.time,
      tourney: this.props.tourney,
    });

    this.setState((state) => ({
      lobbies: [...state.lobbies, { ...newLobby, key: newLobby._id }],
    }));
  };

  add = async (role, key) => {
    const newLobby = await post(`/api/lobby-${role}`, {
      lobby: key,
      teams: this.props.teams,
      tourney: this.props.tourney,
    });
    this.setState((state) => ({
      lobbies: state.lobbies.map((m) => {
        if (m.key === key) {
          return { ...newLobby, key: newLobby._id };
        }
        return m;
      }),
    }));
  };

  // user is optional (only used for commentator)
  remove = async (role, key, target) => {
    const newLobby = await delet(`/api/lobby-${role}`, {
      lobby: key,
      target,
      teams: this.props.teams,
      tourney: this.props.tourney,
    });
    this.setState((state) => ({
      lobbies: state.lobbies.map((m) => {
        if (m.key === key) {
          return { ...newLobby, key: newLobby._id };
        }
        return m;
      }),
    }));
  };

  addReferee = (key) => this.add("referee", key);
  addPlayer = (key) => this.add("player", key);
  removeReferee = (key) => this.remove("referee", key);
  removePlayer = (key, user) => this.remove("player", key, user);

  isMe = (p) => {
    if (this.props.teams) {
      const players = this.props.getInfo(p).players;
      return players && players.some((p) => p._id === this.props.user._id);
    }

    return p === this.props.user.username;
  };

  handleDelete = async (lobby) => {
    await delet("/api/lobby", { lobby: lobby._id, tourney: this.props.tourney });
    this.setState((state) => ({
      lobbies: state.lobbies.filter((m) => m.key !== lobby.key),
    }));
  };

  render() {
    return (
      <>
        {this.props.isAdmin() && (
          <Collapse>
            <Panel header={`Add new Qualifiers lobby`} key="1">
              <Form name="basic" onFinish={this.onFinish}>
                <Form.Item label="Lobby Time" name="time">
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
          <Table dataSource={this.state.lobbies} pagination={false}>
            <Column
              title={
                <span>
                  {"Lobby Time "}
                  <span className="u-bold">({this.props.utcString(this.props.timezone)})</span>
                </span>
              }
              dataIndex="time"
              key="time"
              render={(t) => moment(t).utcOffset(this.props.timezone).format("ddd MM/DD HH:mm")}
            />

            <Column
              title="Referee"
              dataIndex="referee"
              key="referee"
              render={(r, lobby) =>
                r ? (
                  <Tag closable={this.props.isRef()} onClose={() => this.removeReferee(lobby.key)}>
                    {r}
                  </Tag>
                ) : (
                  this.props.isRef() && <AddTag onClick={() => this.addReferee(lobby.key)} />
                )
              }
            />

            <Column
              title={this.props.teams ? "Teams" : "Players"}
              dataIndex="players"
              key="players"
              render={(rs, lobby) => (
                <span>
                  {rs.map((r) => (
                    <Tag
                      closable={this.props.isAdmin() || this.isMe(r)}
                      onClose={() => this.removePlayer(lobby.key, r)}
                      key={r}
                    >
                      {r}
                    </Tag>
                  ))}
                  {this.canRegister(rs) && (
                    <AddTag
                      text={this.props.teams ? "Add my team" : "Add me"}
                      onClick={() => this.addPlayer(lobby.key)}
                    />
                  )}
                </span>
              )}
            />

            {this.props.isAdmin() && (
              <Column
                title="Delete"
                key="submit"
                className="u-textCenter"
                render={(_, lobby) => (
                  <span>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<DeleteOutlined />}
                      size="medium"
                      onClick={() => this.handleDelete(lobby)}
                    />
                  </span>
                )}
              />
            )}
          </Table>
        </div>
      </>
    );
  }
}

export default Qualifiers;
