import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import { departments } from "../constants";
import SearchIcon from "@mui/icons-material/Search";

const ChatBot = ({ open, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [formValues, setFormValues] = useState({
    departmentName: "",
    titleName: "",
    unicode: "",
    fromDate: "",
    toDate: "",
  });

  const [titles, setTitles] = useState([]);
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [unicode, setUnicode] = useState("");

  const [filterApplied, setFilterApplied] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "departmentName") {
      setFormValues((prev) => ({
        ...prev,
        titleName: "",
      }));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/getTitlesByDepartment",
          {
            params: { departmentName: value },
          }
        );
        setTitles(response.data.titles || []);
      } catch (err) {
        console.error("Error fetching titles:", err);
        setTitles([]);
      }
    }
  };
  const handleResetFilter = () => {
    setFormValues({
      departmentName: "",
      titleName: "",
      unicode: "",
      fromDate: "",
      toDate: "",
    });

    setDepartment("");
    setTitle("");
    setUnicode("");

    setFilterApplied(false);

    setMessages([]);

    setInput("");
  };

  const handleSend = async () => {
    if (!input.trim() || !filterApplied) return;

    const question = input;
    const userMessage = { type: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Prepare the filters object
    const filters = {
      department: department,
      title: title,
      unicode: unicode,
    };

    try {
      const response = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, filters }),
      });

      const data = await response.json();
      console.log("Data", data);
      const botMessage = {
        type: "bot",
        text: data?.answer || "Sorry, I didn't get that.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error fetching bot response:", err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleApplyFilter = () => {
    if (!formValues.departmentName.trim()) {
      alert("Please select a department."); // Ensure department is selected
      return;
    }

    setFilterApplied(true);
    setDepartment(formValues.departmentName);
    setTitle(formValues.titleName);
    setUnicode(formValues.unicode);

    setMessages([{ type: "bot", text: "👋 Hi! How can I help you today?" }]);
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: "70vh",
          overflow: "hidden",
          transition: "transform 0.3s ease",
          borderTopLeftRadius: 16,
          borderBottomRightRadius: 16,
          right: 18,
          bottom: 48,
          width: 380,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          margin: 0,
          left: "auto",
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#0D9488",
          color: "white",
          p: 2,
          height: "40px",
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Maharashtra GR ChatBot
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <Typography variant="body2">✖</Typography>
        </IconButton>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 3,
          pt: 2,
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} style={{ width: "100%" }}>
            <FormControl fullWidth size="small">
              <InputLabel
                id="department-name-label"
                sx={{ fontSize: "0.875rem" }}
              >
                Department
              </InputLabel>
              <Select
  labelId="department-name-label"
  id="department-select"
  name="departmentName"
  disabled={filterApplied}
  value={formValues.departmentName}
  onChange={handleInputChange}
  label="Department"
  sx={{
    borderRadius: 2,
    fontSize: "0.875rem",
    height: 36,
    paddingTop: "4px",
  }}
  MenuProps={{
    PaperProps: {
      sx: {
        maxHeight: 300,  
        overflowY: 'auto', 
      },
    },
  }}
>
  {departments.map((department) => (
    <MenuItem key={department.value} value={department.value}>
      {department.label}
    </MenuItem>
  ))}
</Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} style={{ width: "100%" }}>
            <FormControl fullWidth size="small">
              <InputLabel id="title-name-label" sx={{ fontSize: "0.875rem" }}>
                Title
              </InputLabel>
              <Select
                labelId="title-name-label"
                id="title-select"
                name="titleName"
                disabled={filterApplied}
                value={formValues.titleName}
                onChange={handleInputChange}
                label="Title"
                sx={{
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  height: 36,
                  paddingTop: "4px",
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300, 
                      overflowY: 'auto',
                    },
                  },
                }}
              >
                {titles.length === 0 ? (
                  <MenuItem value="" disabled>
                    Select department first
                  </MenuItem>
                ) : (
                  titles.map((title, index) => (
                    <MenuItem key={index} value={title}>
                      {title}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} style={{ width: "100%" }}>
            <TextField
              label="Unique Code"
              name="unicode"
              disabled={filterApplied}
              value={formValues.unicode}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                fontSize: "0.875rem",
                height: 36,
                marginTop: "4px",
              }}
            />
          </Grid>

          <Grid item xs={12} style={{ width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilter}
                startIcon={<SearchIcon />}
                disabled={filterApplied}
                size="small"
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  backgroundColor: "#0D9488",
                  "&:hover": {
                    backgroundColor: "#A7F3D0",
                  },
                }}
              >
                Apply Filter
              </Button>

              {filterApplied && (
                <Button
                  variant="outlined"
                  onClick={handleResetFilter}
                  size="small"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderColor: "#0D9488",
                    color: "#0D9488",
                    "&:hover": {
                      backgroundColor: "#0D9488",
                      color: "white",
                    },
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        <List>
          {messages.map((msg, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: "80%",
                  bgcolor: msg.type === "user" ? "lightgreen" : "grey.200",
                  borderRadius: 2,
                  color: "black",
                }}
              >
                <ListItemText primary={msg.text} />
              </Paper>
            </ListItem>
          ))}
          {isTyping && (
            <ListItem sx={{ justifyContent: "flex-start" }}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: "60%",
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  color: "gray",
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", gap: "6px" }}>
                      {[0, 1, 2].map((_, i) => (
                        <Box
                          key={i}
                          component="span"
                          sx={{
                            animation: "blink 1.4s infinite",
                            animationDelay: `${i * 0.2}s`,
                            fontSize: "22px",
                            lineHeight: 1,
                            "@keyframes blink": {
                              "0%, 80%, 100%": { opacity: 0 },
                              "40%": { opacity: 1 },
                            },
                          }}
                        >
                          •
                        </Box>
                      ))}
                    </Box>
                  }
                />
              </Paper>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2,
          borderTop: "1px solid #eee",
          bgcolor: "background.default",
          flexShrink: 0,
        }}
      >
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          disabled={!filterApplied}
          sx={{
            backgroundColor: "white",
            borderRadius: 2,
            boxShadow: 1,
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!filterApplied}
          sx={{
            bgcolor: filterApplied ? "#0D9488" : "grey.400",
            "&:hover": {
              bgcolor: filterApplied ? "#0D9488" : "grey.500",
            },
            borderRadius: 50,
            p: 1.5,
          }}
        >
          <SendIcon sx={{ color: "white" }} />
        </IconButton>
      </Box>
    </Drawer>
  );
};

export default ChatBot;
