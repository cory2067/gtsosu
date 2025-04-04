import React, { useEffect, useState } from "react";
import { delet, exportCSVFile, get, hasAccess, post, prettifyTourney } from "../../utilities";
import UserCard from "../modules/UserCard";
import "./TourneyStaff.css";

import { Button, Collapse, Form, Input, Layout, Select, message } from "antd";
const { Content } = Layout;
const { Panel } = Collapse;

const roles = [
  "Host",
  "Developer",
  "Mappooler",
  "Head Pooler",
  "Mapper",
  "All-Star Mappooler",
  "Players Moderation Team",
  "Designer",
  "Composer",
  "Referee",
  "Streamer",
  "Commentator",
  "Translator",
  "Wiki Editor",
  "Statistician",
  "Recruiter",
  "Showcase",
  "Judge",
  "Playtester",
  "Artist",
];

// The managerial roles that osu! officially considers as "staff"
const managementRoles = [
  "Mappooler",
  "Showcase",
  "All-Star Mappooler",
  "Head Pooler",
  "Mapper",
  "Developer",
  "Host",
  "Referee",
];

const roleScores = Object.fromEntries(roles.map((role, i) => [role, roles.length - i]));

export default function TourneyStaff({ tourney, user }) {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getImportance = (user) => {
    const myRoles = getRoles(user);
    const scores = myRoles.map((r) => roleScores[r]).sort((a, b) => b - a);

    let total = 0;
    scores.forEach((score, i) => (total += score * Math.pow(roles.length, -i)));
    return total;
  };

  const sortImportance = (staff) => {
    return staff.sort((x, y) => {
      const imp = getImportance(y) - getImportance(x);
      if (imp) return imp;
      return x.username.toLowerCase() > y.username.toLowerCase() ? 1 : -1;
    });
  };

  const fetchStaff = async () => {
    try {
      const staff = await get("/api/staff", { tourney: tourney });

      setStaff(sortImportance(staff));
    } catch (e) {
      message.error("Something went wrong, failed to fetch tourney staff data.");
    }
  };

  useEffect(() => {
    document.title = `${prettifyTourney(tourney)}: Staff`;

    fetchStaff();
  }, []);

  const getRoles = (user) => user.roles.filter((r) => r.tourney === tourney).map((r) => r.role);

  const isAdmin = () => hasAccess(user, tourney, []);

  const onFinish = async (form) => {
    try {
      setIsLoading(true);
      const newStaff = await post("/api/staff", { tourney: tourney, ...form });

      setIsLoading(false);
      setStaff(sortImportance([...staff.filter((s) => s._id !== newStaff._id), newStaff]));
      message.success("New tourney staff added!");
    } catch (e) {
      message.error("Something went wrong, failed to add new tourney staff.");
    }
  };

  const handleDelete = async (username) => {
    try {
      await delet("/api/staff", { tourney: tourney, username });

      setStaff(staff.filter((s) => s.username !== username));
      message.success("Tourney staff deleted!");
    } catch (e) {
      message.error("Something went wrong, failed to delete staff.");
    }
  };

  const exportRolesCSV = ({ players, fileName }) => {
    const header = "Username,User ID,Country,Roles";
    const body = players
      .map((p) => `${p.username},${p.userid},${p.country},"${getRoles(p).join(", ")}"`)
      .join("\n");

    return exportCSVFile({
      header,
      body,
      fileName,
    });
  };

  return (
    <Content className="content">
      {isAdmin() && (
        <>
          <div className="TourneyStaff-admintool">
            <Button
              type="primary"
              onClick={() => {
                const managementStaff = staff.filter((s) =>
                  getRoles(s).some((r) => managementRoles.includes(r))
                );
                exportRolesCSV({
                  players: managementStaff,
                  fileName: `staff-${tourney}.csv`,
                });
              }}
            >
              Export Staff to CSV
            </Button>

            <Button
              type="primary"
              onClick={() => {
                const helpers = staff.filter(
                  (s) => !getRoles(s).some((r) => managementRoles.includes(r))
                );
                exportRolesCSV({
                  players: helpers,
                  fileName: `helpers-${tourney}.csv`,
                });
              }}
            >
              Export Helpers to CSV
            </Button>
          </div>
          <Collapse>
            <Panel header="Add new staff" key="1">
              <Form name="basic" onFinish={onFinish}>
                <Form.Item label="Username" name="username">
                  <Input />
                </Form.Item>
                <Form.Item label="Roles" name="roles">
                  <Select showSearch mode="multiple">
                    {roles.map((role, i) => (
                      <Select.Option key={i} value={role}>
                        {role}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={isLoading}>
                    Add
                  </Button>
                </Form.Item>
              </Form>
            </Panel>
          </Collapse>
        </>
      )}
      <div className="TourneyStaff-container">
        {staff.map((user) => (
          <UserCard
            canDelete={isAdmin()}
            onDelete={handleDelete}
            key={user.userid}
            user={user}
            extra={getRoles(user).join(", ")}
            hideRank
          />
        ))}
      </div>
    </Content>
  );
}
