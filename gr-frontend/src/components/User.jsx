import React, { useState } from "react";

import UserForm from "./UserForm";
import GRList from "./GRList";

const User = () => {
  const [selectedTab, setSelectedTab] = useState("grList");

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const tabButtonStyle = {
    backgroundColor: "#f4f4f4",
    borderRadius: "5px",
    padding: "10px 20px",
    fontSize: "16px",
    fontWeight: "500",
    marginRight: "15px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    "&:hover": {
      backgroundColor: "#e0e0e0",
      transform: "scale(1.05)",
    },
  };

  const activeTabButtonStyle = {
    backgroundColor: "#F1BA88",
    // color: 'white',
    borderRadius: "5px",
    padding: "10px 20px",
    fontSize: "16px",
    fontWeight: "500",
    marginRight: "15px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    "&:hover": {
      backgroundColor: "#1565c0",
      transform: "scale(1.05)",
    },
  };


  return (
    <div
      style={{
        margin: "40px auto",
        padding: "30px",
        borderRadius: "10px",
        backgroundColor: "#fefefe",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        <button
          style={
            selectedTab === "grList" ? activeTabButtonStyle : tabButtonStyle
          }
          onClick={() => handleTabChange("grList")}
        >
          GR List
        </button>
        <button
          style={
            selectedTab === "search" ? activeTabButtonStyle : tabButtonStyle
          }
          onClick={() => handleTabChange("search")}
        >
          Search Details by GR
        </button>
      </div>

      {selectedTab === "search" ? (
        <div>
          <UserForm />
        </div>
      ) : selectedTab === "grList" ? (
        <div>
          <GRList />
        </div>
      ) : null}
    </div>
  );
};

export default User;
