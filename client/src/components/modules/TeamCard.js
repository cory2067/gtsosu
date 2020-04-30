import React, { Component } from "react";
import FlagIcon from "./FlagIcon";
import UserCard from "./UserCard";

import "./TeamCard.css";

class TeamCard extends Component {
  render() {
    return (
      <div className="TeamCard-container">
        <div className="u-flex-justifyCenter">
          <div className="TeamCard-header">
            <FlagIcon size={32} code={this.props.country} className="TeamCard-flag" />
            <span className="TeamCard-name">{this.props.name}</span>
          </div>
        </div>
        {this.props.players
          .map((p, i) => ({ ...p, isCaptain: i === 0, country: null }))
          .sort((x, y) => x.rank - y.rank)
          .map((player) => (
            <UserCard key={player.userid} user={player} />
          ))}
      </div>
    );
  }
}

export default TeamCard;
