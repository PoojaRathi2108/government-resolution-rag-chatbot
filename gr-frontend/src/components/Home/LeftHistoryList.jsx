import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useNavigate } from "react-router-dom";

const expandedWidth = 320;
const collapsedWidth = 82;

const LeftHistoryList = ({
  setDrawerOpen,
  drawerOpen,
  handleNewChat,
  handleMenuOpen,
  selectedIndex,
  setSelectedIndex,
  chatHistory,
  setIsNew,
}) => {
  const navigate = useNavigate();
  const onSelectingTab = (actualIndex, id) => {
    setSelectedIndex(actualIndex);
    setIsNew(false);
    navigate(`/chat/${id}`);
  };
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerOpen ? expandedWidth : collapsedWidth,
        flexShrink: 0,
        whiteSpace: "nowrap",
        [`& .MuiDrawer-paper`]: {
          width: drawerOpen ? expandedWidth : collapsedWidth,
          transition: "width 0.3s",
          overflowX: "hidden",
          boxSizing: "border-box",
          bgcolor: "background.paper",
          color: "text.primary",
          display: "flex",
          flexDirection: "column",
          pt: "80px",
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
          {drawerOpen ? <ChevronLeftRoundedIcon /> : <MenuRoundedIcon />}
        </IconButton>
      </Box>

      <Box sx={{ px: 2, mb: 1 }}>
        {drawerOpen && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleNewChat}
            startIcon={<AddRoundedIcon />}
            sx={{ fontWeight: 600 }}
          >
            New Chat
          </Button>
        )}
        {!drawerOpen && (
          <IconButton
            onClick={handleNewChat}
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              width: "100%",
              "&:hover": {
                backgroundColor: "primary.main",
                color: "#fff", // optional: to maintain contrast
              },
            }}
          >
            <AddRoundedIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List>
          {Array.isArray(chatHistory) &&
            chatHistory
              .slice()
              .reverse()
              .map((chat, index) => {
                const actualIndex = chatHistory.length - 1 - index;
                return (
                  <ListItem key={chat._id} disablePadding>
                    <ListItemButton
                      selected={selectedIndex === actualIndex}
                      onClick={() => {
                        onSelectingTab(actualIndex, chat._id);
                      }}
                      sx={{
                        px: 2,
                        bgcolor:
                          selectedIndex === actualIndex
                            ? "blue"
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            selectedIndex === actualIndex
                              ? "primary.light"
                              : "#656e72",
                        },
                      }}
                    >
                      {drawerOpen ? (
                        <>
                          <ListItemText
                            primary={
                              chat.session_title
                                ? chat.session_title.length > 30
                                  ? chat.session_title.slice(0, 30) + "..."
                                  : chat.session_title
                                : "Untitled Chat"
                            }
                            title={chat.session_title || "Untitled Chat"}
                          />

                          <MoreHorizIcon
                            onClick={(e) => handleMenuOpen(e, chat._id)}
                            style={{ cursor: "pointer", marginLeft: 8 }}
                          />
                        </>
                      ) : (
                        <>
                          <ListItemText
                            primary={
                              chat.session_title
                                ? chat.session_title.length > 1
                                  ? chat.session_title.slice(0, 1) + ".."
                                  : chat.session_title
                                : "Untitled Chat"
                            }
                            title={chat.session_title || "Untitled Chat"}
                          />
                          <MoreHorizIcon
                            onClick={(e) => handleMenuOpen(e, chat._id)}
                            style={{ cursor: "pointer", marginLeft: 8 }}
                          />
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
        </List>
      </Box>
    </Drawer>
  );
};

export default LeftHistoryList;
