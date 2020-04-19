import React, { Component } from "react";

class LoginButton extends Component {
  submit = () => {
    if (this.props.user.username) {
      fetch("/auth/logout").then(() => location.reload());
      return;
    }

    const width = 600;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const popup = window.open(
      "/auth/login/",
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, 
      scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
      height=${height}, top=${top}, left=${left}`
    );

    // Detect when login success, then reload the page
    // It's possible to do this without reloading, this is a lazy workaround (todo)
    const loop = setInterval(() => {
      if (popup.closed) {
        clearInterval(loop);
        location.reload();
      }
    }, 50);
    return loop;
  };

  render() {
    return <div onClick={this.submit}>{this.props.user.username ? "Logout" : "Login"}</div>;
  }
}

export default LoginButton;
