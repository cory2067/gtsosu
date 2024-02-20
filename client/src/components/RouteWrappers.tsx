import { Layout, Spin } from "antd";
import React, { Component, ComponentType, Suspense } from "react";
import { Navbar, NavbarProps } from "./modules/Navbar/Navbar";
import yearConfig from "../content/year-config";
import { navigate, useParams } from "@reach/router";

import "./RouteWrapper.css";
import { User } from "../models/user";

type RouteProps = {
  path: string;
};

type RouteWrapperProps = RouteProps &
  Omit<NavbarProps, "currentPath"> & {
    path: string;
    PageComponent: ComponentType<any>;
    tourney?: string;
  };

export function RouteWrapper(props: RouteWrapperProps) {
  const { PageComponent } = props;

  return (
    <Layout className="RouteWrapper">
      <Navbar {...props} currentPath={props.path} />
      <Suspense
        fallback={
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "10%",
            }}
          >
            <Spin />
          </div>
        }
      >
        <PageComponent {...props}></PageComponent>
      </Suspense>
    </Layout>
  );
}

type TourneyRouteWrapperProps = RouteWrapperProps & {
  year?: number;
};

type TourneyRouteWrapperParams = {
  tourney: string;
};

export function TourneyRouteWrapper(props: TourneyRouteWrapperProps) {
  const { year } = props;
  const { tourney } = useParams();

  const tourneyName = tourney.split("-")[0]; // discard division
  const _year = year ?? yearConfig[tourneyName];
  if (!_year) navigate("/404");

  return (
    <RouteWrapper
      {...props}
      // Workaround for routes that expects an empty user object if not logged in
      user={props.user ?? ({} as User)}
      tourney={`${tourney}_${_year}`}
    ></RouteWrapper>
  );
}
