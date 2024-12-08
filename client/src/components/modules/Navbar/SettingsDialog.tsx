import React from "react";
import { Modal, Typography, message } from "antd";
import { User } from "../../../models/user";
import { useEffect, useState } from "react";
import { get, post } from "../../../utilities";
import UserModal from "../UserModal";

export type SettingsDialogProps = {
  user: User;
  setUser: (any) => void;
  visible: boolean;
  setVisible: (boolean) => void;
};

function TimezoneModal(props) {
  const { onOk, onCancel, visible, user, timezone, loading } = props;
  function displayTimezoneOffset(offset) {
    return offset < 0 ? `UTC${offset}` : `UTC+${offset}`;
  }
  let suppressedTimezoneUpdate = localStorage.getItem("suppressedTimezoneUpdate");

  return (
    <Modal
      okText="Yes"
      cancelText="No"
      onOk={() => {
        localStorage.setItem("suppressedTimezoneUpdate", timezone);
        onOk();
      }}
      onCancel={() => {
        localStorage.setItem("suppressedTimezoneUpdate", timezone);
        onCancel();
      }}
      visible={visible && suppressedTimezoneUpdate != timezone}
      confirmLoading={loading}
      title="Timezone Differs"
    >
      <div style={{ flexDirection: "row" }}>
        <Typography.Text>
          Your browser's time zone ({displayTimezoneOffset(timezone)}) differs from the time zone
          stored in your profile ({displayTimezoneOffset(user.timezone)}). Would you like to update
          your time zone to {displayTimezoneOffset(timezone)}?
        </Typography.Text>
      </div>
    </Modal>
  );
}

export function SettingsDialog(props: SettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showTimezoneModal, setShowTimezoneModal] = useState(true);
  const [timezoneModalLoading, setTimezoneModalLoading] = useState(false);

  const browserTimezone = -(new Date().getTimezoneOffset() / 60);
  const timezoneDiffers = props.user.timezone !== undefined && browserTimezone != props.user.timezone;

  const isIncomplete = () =>
    props.user._id && (!props.user.discord || props.user.timezone === undefined);

  const handleOk = async () => {
    if (formData.timezone === undefined) {
      return message.error("You must fill out these fields");
    }

    setLoading(true);
    await post("/api/settings", formData);
    props.setUser({ ...props.user, ...formData });
    setLoading(false);
    props.setVisible(false);
  };

  const handleCancel = () => {
    if (isIncomplete()) {
      return message.error("You must fill out these fields");
    }
    props.setVisible(false);
  };

  const handleFormChange = (changed, allData) => {
    setFormData(allData);
  };

  const handleTimezoneModalOk = async () => {
    setTimezoneModalLoading(true);

    try {
      await post("/api/settings", {
        timezone: browserTimezone,
      });
      props.setUser({ ...props.user, timezone: browserTimezone });
    } catch (e) {
      message.error("Failed to update time zone");
    }

    setShowTimezoneModal(false);
    setTimezoneModalLoading(false);
  };

  const handleTimezoneModalCancel = () => {
    setShowTimezoneModal(false);
  };

  useEffect(() => {
    if (isIncomplete()) {
      props.setVisible(true);
    }
    setFormData(props.user);
  }, [props.user]);

  return (
    <>
      {props.user?._id && (
        <>
          <UserModal
            visible={props.visible}
            loading={loading}
            user={props.user}
            setUser={props.setUser}
            formData={formData}
            handleOk={handleOk}
            handleCancel={handleCancel}
            onValuesChange={handleFormChange}
          />
          <TimezoneModal
            visible={timezoneDiffers && showTimezoneModal}
            user={props.user}
            timezone={browserTimezone}
            onOk={handleTimezoneModalOk}
            onCancel={handleTimezoneModalCancel}
            loading={timezoneModalLoading}
          />
        </>
      )}
    </>
  );
}
