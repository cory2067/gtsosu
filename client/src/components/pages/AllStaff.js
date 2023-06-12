import React, { useEffect, useState } from "react";
import { get, prettifyTourney, tokenizeTourney } from "../../utilities";
import UserCard from "../modules/UserCard";
import "./AllStaff.css";

import { Layout, Popover, message } from "antd";
const { Content } = Layout;

export default function AllStaff() {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      const staff = await get("/api/staff", {});

      setStaff(staff.sort((x, y) => y.roles.length - x.roles.length));
    } catch (e) {
      message.error("Something went wrong, failed to fetch staff data.");
    }
  };

  useEffect(() => {
    document.title = "GTS Team";

    fetchStaff();
  }, []);

  const sortTourneys = (tourneys) =>
    tourneys.sort((x, y) => {
      const tourney1 = tokenizeTourney(x);
      const tourney2 = tokenizeTourney(y);
      if (tourney1.year !== tourney2.year) {
        return tourney2.year - tourney1.year;
      }
      return tourney1.codeAndDivision.localeCompare(tourney2.codeAndDivision);
    });

  const getTourneyToRoles = (roles) => {
    const tourneyToRoles = {};
    roles.forEach((role) => {
      if (!tourneyToRoles[role.tourney]) {
        tourneyToRoles[role.tourney] = [];
      }
      tourneyToRoles[role.tourney].push(role.role);
    });
    return tourneyToRoles;
  };

  const getPopoverContent = (tourneyToRoles) => {
    const roleStrings = sortTourneys(Object.keys(tourneyToRoles)).map((tourney) => {
      const roles = tourneyToRoles[tourney];
      return `${prettifyTourney(tourney)}: ${roles.join(", ")}`;
    });
    return (
      <div className="AllStaff-popover">
        {roleStrings.map((role) => (
          <div>{role}</div>
        ))}
      </div>
    );
  };

  const plural = (length, name) => (length === 1 ? name : `${name}s`);

  return (
    <Content className="content">
      <div className="AllStaff-container">
        {staff.map((user) => {
          const tourneyToRoles = getTourneyToRoles(user.roles);
          const numTourneys = Object.keys(tourneyToRoles).length;
          const numRoles = user.roles.length;
          return (
            <UserCard
              canDelete={false}
              key={user.userid}
              user={user}
              extra={
                <Popover content={getPopoverContent(tourneyToRoles)} placement="bottom">
                  {`${numRoles} ${plural(numRoles, "role")} for `}
                  {`${numTourneys} ${plural(numTourneys, "tournament")}`}
                </Popover>
              }
              hideRank
            />
          );
        })}
      </div>
    </Content>
  );
}
