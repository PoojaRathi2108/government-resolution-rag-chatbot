import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Fab } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import User from './components/User';
import ChatBot from './components/ChatBot';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import AuthForm from './components/Auth/AuthForm';
import GRQueries from './components/Home/Queries/HomeQueries';
import MyLayoutWithDrawer from './components/Home/Home';
import AdminPanel from './components/AdminPanel/AdminPanel';
import { ToastContainer } from 'react-toastify';
import LogoutIcon from '@mui/icons-material/Logout';

import "react-toastify/dist/ReactToastify.css";
import RoleProtectedRoute from './routes/RoleProtectedRoute';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './Redux/features/user/userSlice';
import Home from './components/Home/Home';
import NewQueries from './components/Home/Queries/NewQueries';
import ThreadQueries from './components/Home/Queries/ThreadQueries';
// import NewQueries from './components/Home/Queries/NewQueries';

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const auth = useSelector((state) => state.user.auth);
  const dispatch = useDispatch();

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        // px: 2,
        // pt: '90px', // AppBar height
        // pb: '90px', // Footer height        
      }}
    >
      {/* Fixed App Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: '#0D9488',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          px: 2,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            height: 80,              // Ensures height
            minHeight: '80px !important', // Force override MUI defaults
          }}
        >
          {/* Hamburger Icon (optional) */}
          <IconButton edge="start" color="inherit" sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>

          {/* Left Logo */}
          <Box
            component="img"
            src="/government.png"
            alt="Government Logo"
            sx={{ height: 70, mr: 2 }}
          />
          {/* <Box
            component="img"
            src="/dharashivLogo.png"
            alt="Dharashiv Logo"
            sx={{ height: 68 }}
          /> */}

          {/* Title */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              letterSpacing: '.5px',
              color: '#ffffff',
              flexGrow: 1,
              textAlign: 'center',
              fontSize: '1.5rem',
            }}
          >
            कल्पवृक्ष - Smart GR System
          </Typography>

          {/* Right Logo */}
          {auth && <Button
            component={Link}
            onClick={()=>{
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              dispatch(logout());
            }}
            to="/auth"
            variant="contained"
            color="inherit"
            sx={{color: "#0D9488" ,bgcolor: 'white', fontWeight: 700, '&:hover': { bgcolor: 'white' } }}
          >
            Logout &nbsp;
            <LogoutIcon />
          </Button>}
          {/* <Box
            component="img"
            src="/government.png"
            alt="Government Logo"
            sx={{ height: 70, ml: 2 }}
          /> */}
        </Toolbar>
      </AppBar>



      {/* <Toolbar /> */}

      {/* Scrollable Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, overflowY: 'auto', }}
      >
        <Routes>
          <Route path="/" element={ <RoleProtectedRoute  allowedRoles={["admin"]}><Home /> </RoleProtectedRoute>} />
          {/* <Route path="/user" element={<User />} /> */}
          <Route path="/adminPanel" element={<AdminPanel />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/chat/:id" element={<RoleProtectedRoute  allowedRoles={["admin"]}><Home /></RoleProtectedRoute>} />
          <Route path="/chat/new" element={<RoleProtectedRoute  allowedRoles={["admin"]}><Home /></RoleProtectedRoute>} />
        </Routes>
      </Box>

      {/* Fixed Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          textAlign: 'left',
          bgcolor: '#1e1e1e', // Dark gray/black
          color: '#f0f0f0',     // Light text
          position: 'fixed',
          width: '100%',
          bottom: 0,
          boxShadow: '0 -2px 4px rgba(0,0,0,0.1)', // Subtle top shadow
          display: 'flex',
          justifyContent: 'space-between', // Distribute content evenly with space between
          alignItems: 'center', // Vertically align text
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} <strong>Zilla Parishad, Dharashiv!</strong> All Rights Reserved by Zilla Parishad, Dharashiv!
        </Typography>
        <Typography variant="body2" sx={{ marginRight: 5 }}>
          Developed and designed by{' '}
          <strong>Chainworks Digital Private Limited</strong>
        </Typography>
      </Box>

      {/* <Fab
        color="primary"
        onClick={() => setChatOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 24,
          bgcolor: '#0F7A44',
          '&:hover': { bgcolor: '#0d6c3c' },
        }}
      >
        <MessageRoundedIcon />
      </Fab> */}

      {/* Chatbot Drawer */}
      <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
        limit={3}
      />
    </Box>
  );
}

export default App;
