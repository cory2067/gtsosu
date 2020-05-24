import React, { Component } from "react";
import "../../utilities.css";
import { get, post, hasAccess, delet } from "../../utilities";
import UserCard from "../modules/UserCard";
import "./TourneyStaff.css";

import { Layout, Collapse, Form, Input, Select, Button } from "antd";
const { Content } = Layout;
const { Panel } = Collapse;

const roles = [
  "Host",
  "Developer",
  "Mapsetter",
  "Designer",
  "Referee",
  "Stream Highlighter",
  "Streamer",
  "Commentator",
  "Translator",
  "Wiki Editor",
  "Statistician",
  "Recruiter",
];

const roleScores = Object.fromEntries(roles.map((role, i) => [role, roles.length - i]));

class TourneyStaff extends Component {
  constructor(props) {
    super(props);
    this.state = { staff: [] };
  }

  async componentDidMount() {
    document.title = `${this.props.tourney.toUpperCase()}: Staff`;
    const staff = await get("/api/staff", { tourney: this.props.tourney });
    this.setState({ staff: this.sort(staff) });
  }

  getRoles = (user) =>
    user.roles.filter((r) => r.tourney === this.props.tourney).map((r) => r.role);

  getImportance = (user) => {
    const myRoles = this.getRoles(user);
    const scores = myRoles.map((r) => roleScores[r]).sort((a, b) => b - a);

    let total = 0;
    scores.forEach((score, i) => (total += score * Math.pow(roles.length, -i)));
    return total;
  };

  sort = (staff) => {
    return staff.sort((x, y) => {
      const imp = this.getImportance(y) - this.getImportance(x);
      if (imp) return imp;
      return x.username.toLowerCase() > y.username.toLowerCase() ? 1 : -1;
    });
  };

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);

  onFinish = async (form) => {
    const newStaff = await post("/api/staff", { tourney: this.props.tourney, ...form });
    this.setState((state) => ({
      staff: this.sort([...state.staff.filter((s) => s._id !== newStaff._id), newStaff]),
    }));
  };

  handleDelete = async (username) => {
    await delet("/api/staff", { tourney: this.props.tourney, username });
    this.setState((state) => ({
      staff: state.staff.filter((s) => s.username !== username),
    }));
  };

  render() {
    return (
      <Content className="content">
        {this.isAdmin() && (
          <Collapse>
            <Panel header="Add new staff" key="1">
              <Form name="basic" onFinish={this.onFinish}>
                <Form.Item label="Username" name="username">
                  <Input />
                </Form.Item>
                <Form.Item label="Role" name="role">
                  <Select showSearch>
                    {roles.map((role, i) => (
                      <Select.Option key={i} value={role}>
                        {role}
                      </Select.Option>
                    ))}
                  </Select>
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
        <div className="TourneyStaff-container">
          {this.state.staff.map((user) => (
            <UserCard
              canDelete={this.isAdmin()}
              onDelete={this.handleDelete}
              key={user.userid}
              user={user}
              extra={this.getRoles(user).join(", ")}
              hideRank
            />
          ))}
        </div>
      </Content>
    );
  }
}

export default TourneyStaff;
