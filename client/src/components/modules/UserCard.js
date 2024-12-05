import React from "react";
import { DeleteOutlined, CrownOutlined, HeartFilled } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import FlagIcon from "./FlagIcon";

import { Popconfirm, Tooltip } from "antd";
import "./UserCard.css";
import SeedGroupForm from "./SeedGroupForm";

export default function UserCard({
  canDelete,
  canEdit,
  extra,
  flags,
  hideRank,
  onDelete,
  onEdit,
  rankRange,
  showGroups,
  stats,
  user,
}) {
  const timezone = `UTC${user.timezone > 0 ? "+" : ""}${user.timezone}`;
  const badRank = rankRange && (user.rank < rankRange[0] || user.rank > rankRange[1]);
  const cardStyle = {};
  if (user.cardImage) {
    cardStyle.backgroundImage = `linear-gradient(#13141599, #2e313599), url("/public/cards/${user.cardImage}")`;
    cardStyle.backgroundSize = "contain";
  }
  const seedInfo = stats && stats.seedName ? `${stats.seedName} Seed (#${stats.seedNum})${stats.group ? `, Group ${stats.group}` : ""}` : "";

  return (
    <div>
      <div className={`UserCard-outside ${canEdit && showGroups ? "UserCard-wide" : ""}`} style={cardStyle}>
        {user.discord ? (
          <Tooltip title={`${user.discord}, ${timezone}`}>
            <div
              style={{ backgroundImage: `url(${user.avatar})` }}
              className="UserCard-avatar"
            ></div>
          </Tooltip>
        ) : (
          <div style={{ backgroundImage: `url(${user.avatar})` }} className="UserCard-avatar"></div>
        )}
        <div className="UserCard-content">
          <div className="UserCard-left">
            <div className={`UserCard-name ${user.username.length > 14 ? "UserCard-long" : ""}`}>
              {user.country && <FlagIcon code={user.country} />}
              <a href={`https://osu.ppy.sh/users/${user.userid}`}>{user.username}</a>
              {user.donations >= 5 && (
                <Tooltip title={`GTS Supporter - Donated $${user.donations.toFixed(2)}`}>
                  <FontAwesomeIcon icon={faHeart} className="supporter-icon" />
                </Tooltip>
              )}
              {canDelete && (
                <Popconfirm
                  title={`Are you sure you want to remove ${user.username}?`}
                  onConfirm={() => onDelete(user.username)}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined className="UserCard-delete" />
                </Popconfirm>
              )}
              {user.isCaptain && <CrownOutlined className="UserCard-captain" />}
            </div>
            {extra && <div className="UserCard-bot">{extra}</div>}
            {seedInfo && <div className="UserCard-bot">{seedInfo}</div>}
          </div>
          {!hideRank && (
            <div className={`UserCard-rank ${badRank ? "UserCard-bad" : ""}`}>
              <span>{user.rank ? `#${user.rank}` : "No rank"}</span>
            </div>
          )}
        </div>
        {canEdit && (
          <div>
            <SeedGroupForm
              className="UserCard-form"
              isTeam={false}
              initialValues={stats}
              onEdit={onEdit}
              target={user._id}
              hideGroups={!showGroups}
              flags={flags}
            />
          </div>
        )}
      </div>
    </div>
  );
}
