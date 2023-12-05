import { Layout, Spin } from "antd";
import React, { Component, ComponentType, Suspense } from "react";
import { Navbar, NavbarProps } from "./modules/Navbar/Navbar";
import yearConfig from "../content/year-config";
import { navigate } from "@reach/router";

type RouteProps = {
  path: string;
};

type RouteWrapperProps = RouteProps &
  NavbarProps & {
    PageComponent: ComponentType<any>;
    tourney?: string;
  };

export function RouteWrapper(props: RouteWrapperProps) {
  const { PageComponent } = props;

  return (
    <Layout>
      <Navbar {...props} />
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
  tourney: string;
};

export function TourneyRouteWrapper(props: TourneyRouteWrapperProps) {
  const { year, tourney } = props;

  const tourneyName = tourney.split("-")[0]; // discard division
  const _year = year ?? yearConfig[tourneyName];
  if (!_year) navigate("/404");

  return <RouteWrapper {...props} tourney={`${tourney}_${_year}`}></RouteWrapper>;
}
