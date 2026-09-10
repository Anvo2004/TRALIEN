import React from "react";
import { Page, Header } from "zmp-ui";

const FLOOD_MAP_URL = "https://flood-web-test.busmap.vn/";

const BanDoMuaNgapPage = () => {
  return (
    <Page className="page-flood-map">
      <Header title="Bản đồ mưa ngập" />
      <div className="flood-map-frame">
        <iframe
          src={FLOOD_MAP_URL}
          title="Bản đồ mưa ngập"
          allow="geolocation"
        />
      </div>
    </Page>
  );
};

export default BanDoMuaNgapPage;
