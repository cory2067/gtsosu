import React, { Component } from "react";
import FlagIcon from "./FlagIcon";

import { Card } from "antd";
import "./UserCard.css";

class UserCard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div class="UserCard-outside">
        <div
          style={{ backgroundImage: `url(${this.props.user.avatar})` }}
          class="UserCard-avatar"
        ></div>
        <div class="UserCard-content">
          <div class="UserCard-top">
            <div class="UserCard-name">
              {this.props.user.country && <FlagIcon code={this.props.user.country.toLowerCase()} />}
              <a href={`https://osu.ppy.sh/users/${this.props.user.userid}`}>
                {this.props.user.username}
              </a>
            </div>
            {!this.props.hideRank && (
              <div class="UserCard-rank">
                <span>{`#${this.props.user.rank || 3500}`}</span>
              </div>
            )}
          </div>
          {this.props.extra && <div class="UserCard-bot">{this.props.extra}</div>}
        </div>
      </div>
    );
  }
}

export default UserCard;
