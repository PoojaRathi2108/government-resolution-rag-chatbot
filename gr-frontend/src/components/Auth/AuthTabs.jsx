import React from 'react';
import { Tabs, Tab } from '@mui/material';

const AuthTabs = ({ tab, setTab }) => {
  return (
    <Tabs
      value={tab}
      onChange={(e, val) => setTab(val)}
      centered
      sx={{ mb: 3, mt: 3 }}
    >
      <Tab label="Login" />
      {/* <Tab label="Signup" /> */}
    </Tabs>
  );
};

export default AuthTabs;
