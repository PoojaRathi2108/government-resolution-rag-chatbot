import React, { useEffect, useState } from "react";
import {
  Box,
  Toolbar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { useSelector } from "react-redux";
import LeftHistoryList from "./LeftHistoryList";
import HomeQuieries from "./Queries/HomeQueries";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const { user } = useSelector((state) => state?.user);
  const [isNew, setIsNew] = useState(true);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingID, setEditingID] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState(null);

  const navigate = useNavigate();

  const handleMenuOpen = (event, chatId) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setCurrentChatId(chatId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentChatId(null);
  };

  const handleEditChat = async (chatId) => {
    const currentChat = chatHistory.find((chat) => chat._id === chatId);
    if (currentChat) {
      setEditingID(chatId);
      setEditingTitle(currentChat.session_title || "");
      setEditDialogOpen(true);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingTitle("");
  };

  const handleSaveTitle = async () => {
    try {
      await axios.put(
        `https://gr-backend-latest.onrender.com/api/editChatHistoryTitle?session_id=${editingID}`,
        {
          session_id: editingID,
          new_title: editingTitle,
        }
      );

      setChatHistory((prev) =>
        prev.map((chat) =>
          chat._id === editingID
            ? { ...chat, session_title: editingTitle }
            : chat
        )
      );

      handleEditDialogClose();
      console.log("Chat title updated successfully");
    } catch (err) {
      console.error("Error updating chat title:", err);
    }
  };

  const handleNewChat = () => {
    setIsNew(true);
    setSelectedIndex(-1);
    navigate(`/chat/new`);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#0D9488",
      },
      background: {
        default: darkMode ? "#2b2b2b" : "#f4f6f8",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
    },
    shape: {
      borderRadius: 12,
    },
  });

  const confirmDeleteChat = async () => {
    try {
      console.log("Deleting chat with ID:", deletingChatId);

      if (deletingChatId !== "new") {
        await axios.put(
          `https://gr-backend-latest.onrender.com/api/deleteChatHistory?session_id=${deletingChatId}`
        );
      }
      if (chatHistory.findIndex((chat) => chat._id === deletingChatId)) {
        setSelectedIndex(-1);
      }
      setChatHistory((prev) =>
        prev.filter((chat) => chat._id !== deletingChatId)
      );
      setDeleteDialogOpen(false);
      setDeletingChatId(null);
      console.log("Chat deleted successfully");
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = user?.user?._id;
        console.log("User ID:", userId);

        const response = await axios.get(
          `https://gr-backend-latest.onrender.com/api/getAllChatHistory?userId=${userId}`
        );
        setChatHistory(response.data.session || []);
        console.log("Dummy Data:", response.data.session);
      } catch (err) {
        console.error("Error fetching dummy data:", err);
        setChatHistory([]);
      }
    };
    fetchData();
  }, [user?.user?._id]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/chat/new") {
      setIsNew(true);
      setSelectedIndex(-1);
    } else if (path.startsWith("/chat/")) {
      const sessionId = path.split("/chat/")[1];
      const index = chatHistory.findIndex((chat) => chat._id === sessionId);
      if (index !== -1) {
        setSelectedIndex(index);
        setIsNew(false);
      } else {
        setSelectedIndex(-1);
        setIsNew(true);
      }
    }
  }, [chatHistory, window.location.pathname]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}
      >
        <LeftHistoryList
          setIsNew={setIsNew}
          handleNewChat={handleNewChat}
          setDrawerOpen={setDrawerOpen}
          drawerOpen={drawerOpen}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          chatHistory={chatHistory}
          handleMenuOpen={handleMenuOpen}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            color: "text.primary",
            minHeight: "100vh",
            pt: 3,
          }}
        >
          <Toolbar />

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <MenuItem
              onClick={() => {
                handleEditChat(currentChatId);
                handleMenuClose();
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              onClick={() => {
                setDeletingChatId(currentChatId);
                setDeleteDialogOpen(true);
                handleMenuClose();
              }}
            >
              Delete
            </MenuItem>
          </Menu>

          <Dialog
            open={editDialogOpen}
            onClose={handleEditDialogClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Rename Chat Title</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Chat Title"
                fullWidth
                variant="outlined"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTitle();
                  }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditDialogClose} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleSaveTitle}
                color="primary"
                variant="contained"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              Are you sure you want to delete this chat?
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                color="secondary"
              >
                No
              </Button>
              <Button
                onClick={confirmDeleteChat}
                color="error"
                variant="contained"
              >
                Yes, Delete
              </Button>
            </DialogActions>
          </Dialog>

          <HomeQuieries
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            dummyData={chatHistory[selectedIndex]?.entries || []}
            session_id={chatHistory[selectedIndex]?._id || "new"}
            setSelectedIndex={setSelectedIndex}
            isNew={isNew}
            setIsNew={setIsNew}
            setChatHistory={setChatHistory}
            selectedIndex={selectedIndex}
            chatHistory={chatHistory || []}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Home;