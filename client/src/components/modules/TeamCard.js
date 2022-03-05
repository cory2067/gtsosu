import React, { Component } from "react";
import FlagIcon from "./FlagIcon";
import UserCard from "./UserCard";
import SeedGroupForm from "./SeedGroupForm";
import { Popconfirm, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import "./TeamCard.css";

export default function TeamCard({
  _id,
  country,
  flags,
  group,
  icon,
  isAdmin,
  name,
  onDelete,
  onEdit,
  onEditStats,
  players,
  seedName,
  seedNum,
  showGroups,
}) {
  const defaults = {};
  if (seedNum) defaults.seedNum = seedNum;
  if (seedName) defaults.seedName = seedName;
  if (group) defaults.group = group;

  return (
    <div className="TeamCard-container">
      {seedName && <div className={`TeamCard-seed TeamCard-seed-${seedName}`}></div>}
      <div>
        <div className="TeamCard-head-wrapper">
          <div className="TeamCard-header">
            <Tooltip
              title={seedName ? `${seedName} Seed (#${seedNum})` : `Seed not yet determined`}
            >
              <FlagIcon size={32} customIcon={icon} code={country} className="TeamCard-flag" />
              <span className="TeamCard-name">{name}</span>
            </Tooltip>
            {isAdmin && (
              <>
                {onEdit && <EditOutlined onClick={() => onEdit(_id)} className="TeamCard-icon" />}
                <Popconfirm
                  title={`Are you sure you want to remove ${name}?`}
                  onConfirm={() => onDelete(_id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined className="TeamCard-icon" />
                </Popconfirm>
              </>
            )}
          </div>
          {group && <div className="TeamCard-group">{group}</div>}
        </div>
        {players
          .map((p, i) => ({ ...p, isCaptain: i === 0, country: null }))
          .sort((x, y) => (x.rank || Infinity) - (y.rank || Infinity))
          .map((player) => (
            <UserCard key={player.userid} user={player} />
          ))}

        {isAdmin && (
          <div className="TeamCard-form">
            <SeedGroupForm
              onEdit={onEditStats}
              isTeam={true}
              initialValues={defaults}
              target={_id}
              hideGroups={!showGroups}
              flags={flags}
            />
          </div>
        )}
      </div>
    </div>
  );
}
