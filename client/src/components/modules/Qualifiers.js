import React, { Component } from "react";
import { Collapse, Form, Button, Table, DatePicker, Tag, message } from "antd";
import moment from "moment";
import AddTag from "../modules/AddTag";
import AddPlayerModal from "../modules/AddPlayerModal";
import SubmitLobbyModal from "../modules/SubmitLobbyModal";
const { Panel } = Collapse;
import { PlusOutlined, LinkOutlined, DeleteOutlined } from "@ant-design/icons";
import { get, post, delet, hasAccess } from "../../utilities";
const { Column } = Table;

class Qualifiers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lobbies: [],
      rescheduleDeadline: props.currentStage.rescheduleDeadline,
    };
  }

  async componentDidMount() {
    this.getLobbies();

    const teams = await get("/api/teams", { tourney: this.props.tourney });
    const players = await get("/api/players", { tourney: this.props.tourney });
    const teamLookup = Object.fromEntries(teams.map((p) => [p.name, p]));
    const playerLookup = Object.fromEntries(players.map((p) => [p.username, p]));
    this.setState({ teamLookup, playerLookup });
  }

  async getLobbies() {
    const lobbies = await get("/api/lobbies", {
      tourney: this.props.tourney,
    });
    this.setState({ lobbies: lobbies.map((m) => ({ ...m, key: m._id })) });
  }

  isStaff = () =>
    hasAccess(this.props.user, this.props.tourney, [
      "Referee",
      "Mappooler",
      "All-Star Mappooler",
      "Head Pooler",
      "Mapper",
    ]);

  canRegister(lobby) {
    if (!this.props.user._id) return false;
    if (this.isStaff()) return false;

    // Check if reschedule deadline has passed
    if (new Date().getTime() > new Date(this.state.rescheduleDeadline ?? 0)) return false;

    // Check if lobby is full
    if (this.props.tournament.lobbyMaxSignups) {
      if (lobby.length >= this.props.tournament.lobbyMaxSignups) return false;
    } else {
      if (!this.props.teams && lobby.length >= 8) return false; // individual limit
      else if (this.props.teams && lobby.length >= 4) return false; // team limit
    }

    // Check if player is registered
    if (this.state.playerLookup?.[this.props.user.username] === undefined) return false;

    // Check if player is signed up to another lobby
    if (!this.props.teams) {
      return this.state.lobbies.every((lobby) => !lobby.players.includes(this.props.user.username));
    }

    // Check if player doesn't have a team and if not captain and if signed up to another lobby
    else {
      const myTeam = this.props.getTeam(this.props.user.username);
      if (!myTeam) return false;

      const isCaptain = myTeam.players[0].username === this.props.user.username;
      if (!isCaptain) return false;

      return this.state.lobbies.every((lobby) => lobby.players.every((team) => team !== myTeam.name));
    }
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

  applyStageChanges = async (lobbyData) => {
    const rescheduleDeadline = new Date(this.props.stripTimezone(lobbyData.rescheduleDeadline));
    rescheduleDeadline.setUTCSeconds(0);
    try {
      const tourneyModel = await post("/api/stage", {
        tourney: this.props.tourney,
        stage: { ...this.props.currentStage, rescheduleDeadline },
        index: this.props.currentStage.index,
      });
      this.setState((state) => ({
        rescheduleDeadline: tourneyModel.rescheduleDeadline,
      }));
      message.success("Successfully updated stage");
    } catch (e) {
      message.error(e.message || e);
    }
  }

  updateLobbyInState = (newLobby, key) => {
    this.setState((state) => ({
      lobbies: state.lobbies.map((m) => {
        if (m.key === key) {
          return { ...newLobby, key: newLobby._id };
        }
        return m;
      }),
    }));
  };

  add = async (role, key, user) => {
    try {
      const newLobby = await post(`/api/lobby-${role}`, {
        lobby: key,
        user,
        teams: this.props.teams,
        tourney: this.props.tourney,
      });
      this.updateLobbyInState(newLobby, key);
    } catch (e) {
      message.error(e.message || e);
      if (e.updatedLobby) {
        this.updateLobbyInState(e.updatedLobby, key);
      }
    }
  };

  // user is optional (only used for commentator)
  remove = async (role, key, target) => {
    // Make the update in case the request fails because the antd Tag is removed
    // instantly and can't be added back unless the data itself is also updated
    const theLobby = this.state.lobbies.find(lobby => lobby.key === key);
    const updatedLobby = structuredClone(theLobby);
    const updatedPlayers = updatedLobby.players.filter(player => player !== target);
    updatedLobby.players = updatedPlayers;
    this.updateLobbyInState(updatedLobby, key);
    try {
      const newLobby = await delet(`/api/lobby-${role}`, {
        lobby: key,
        target,
        teams: this.props.teams,
        tourney: this.props.tourney,
      });
      this.updateLobbyInState(newLobby, key);
    } catch (e) {
      message.error(e.message || e);
      this.updateLobbyInState(theLobby, key);
    }
  };

  addReferee = (key) => this.add("referee", key);
  addPlayer = (key) => this.add("player", key);
  removeReferee = (key) => this.remove("referee", key);
  removePlayer = (key, user) => this.remove("player", key, user);

  promptAndAddReferee = (key) => {
    const user = prompt("Enter a username");
    if (!user) return;
    this.add("referee", key, user);
  };

  canRemoveFromLobby = (p) => {
    if (this.props.teams) {
      const players = this.props.getInfo(p).players;
      return players && players[0]._id === this.props.user._id; // must be captain (index 0)
    }

    return p === this.props.user.username;
  };

  handleDelete = async (lobby) => {
    await delet("/api/lobby", { lobby: lobby._id, tourney: this.props.tourney });
    this.setState((state) => ({
      lobbies: state.lobbies.filter((m) => m.key !== lobby.key),
    }));
  };

  handleAddPlayer = async () => {
    this.setState({ addPlayerModalLoading: true });
    this.add("player", this.state.lobbyKey, this.state.addPlayerData);
    this.setState((state) => ({
      addPlayerModalLoading: false,
      addPlayerModalVisible: false,
    }));
  };

  handleSubmitLobbyOk = async () => {
    this.setState({ submitLobbyModalLoading: true });
    try {
      const newLobby = await post("/api/lobby-results", {
        ...this.state.formData,
        lobby: this.state.lobbyKey,
        tourney: this.props.tourney,
      });

      this.setState((state) => ({
        submitLobbyModalLoading: false,
        submitLobbyModalVisible: false,
        lobbies: state.lobbies.map((m) => {
          if (m.key === state.lobbyKey) {
            return { ...newLobby, key: newLobby._id };
          }
          return m;
        }),
      }));
    } catch (e) {
      message.error(e.message || e);
      this.setState({ submitLobbyModalLoading: false });
    }
  };

  handleSubmitLobbyValuesChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  render() {
    return (
      <>
        {this.props.isAdmin() && (
          <div className="admin-panel">
            <Form name="editStage"
              initialValues={{["rescheduleDeadline"]:moment(this.state.rescheduleDeadline).utcOffset(0)}}
              onFinish={this.applyStageChanges}
              layout="inline"
            >
              <Form.Item label="Reschedule Deadline" name="rescheduleDeadline">
                <DatePicker showTime format={"MM/DD HH:mm"} minuteStep={15} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Form>
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
          </div>
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
                  <>
                    {this.props.isRef() && <AddTag onClick={() => this.addReferee(lobby.key)} />}
                    {this.props.isAdmin() && (
                      <AddTag
                        text="Add someone"
                        onClick={() => this.promptAndAddReferee(lobby.key)}
                      />
                    )}
                  </>
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
                      closable={this.props.isAdmin() || this.canRemoveFromLobby(r)}
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
                  {this.props.isAdmin() && (
                    <AddTag
                      text={this.props.teams ? "Add a team" : "Add someone"}
                      onClick={() =>
                        this.setState({ addPlayerModalVisible: true, lobbyKey: lobby.key })
                      }
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

            {(this.props.isRef() || this.props.currentStage?.statsVisible) && (
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
            )}

            {this.props.isRef() && (
              <Column
                title="Submit"
                key="submit"
                className="u-textCenter"
                render={(_, lobby) => (
                  <span>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<PlusOutlined />}
                      size="medium"
                      onClick={() =>
                        this.setState({ submitLobbyModalVisible: true, lobbyKey: lobby.key })
                      }
                    />
                  </span>
                )}
              />
            )}
          </Table>
        </div>
        <AddPlayerModal
          title={this.props.teams ? "Add a team" : "Add a player"}
          label={this.props.teams ? "Team Name" : "Player Name"}
          visible={this.state.addPlayerModalVisible}
          loading={this.state.addPlayerModalLoading}
          handleOk={this.handleAddPlayer}
          handleCancel={() => this.setState({ addPlayerModalVisible: false })}
          onValuesChange={(changed, data) => this.setState({ addPlayerData: data.username })}
          options={this.props.teams ? this.state.teamLookup : this.state.playerLookup}
        />
        <SubmitLobbyModal
          visible={this.state.submitLobbyModalVisible}
          loading={this.state.submitLobbyModalLoading}
          handleCancel={() => this.setState({ submitLobbyModalVisible: false })}
          handleOk={this.handleSubmitLobbyOk}
          onValuesChange={this.handleSubmitLobbyValuesChange}
        />
      </>
    );
  }
}

export default Qualifiers;
