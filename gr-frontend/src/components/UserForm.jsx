import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
} from "@mui/material";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { departments } from "../constants";

const UserForm = ({ departmentName, titleName, unicode }) => {
  const [formValues, setFormValues] = useState({
    departmentName: departmentName || "", 
    titleName: titleName || "",
    unicode: unicode || "",
    fromDate: "",
    toDate: "",
  });

  const [titles, setTitles] = useState([]);
  useEffect(() => {
    if (formValues.departmentName && formValues.titleName && formValues.unicode) {
      handleSearch(); 
    }
  }, [formValues]);

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
  const [grDetails, setGrDetails] = useState(null);
  const [error, setError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const handleChatAsk = async () => {
    if (!chatInput.trim()) return;

    const newQuestion = chatInput;
    setChatInput("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/askQuestionByUser",
        {
          question: newQuestion,
          unicode: grDetails?.english?.unicode,
          departmentName: grDetails?.english?.department,
          titleName: grDetails?.english?.title || "",
        }
      );

      const answer = res.data.answer;
      setChatHistory((prev) => [...prev, { question: newQuestion, answer }]);
    } catch (error) {
      console.error("Chat error:", error);
      alert(`Server Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSearch = async () => {
    const { departmentName, titleName, unicode } = formValues;

    if (!departmentName) {
      setError("Please select both Department and Unicode.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/api/search-gr", {
        params: {
          departmentName,
          titleName,
          unicode,
        },
      });

      const result = response.data?.data;

      if (result && result.grFile) {
        console.log("GR Details:", result);
        setGrDetails(result);
        setError("");
        setChatHistory([]);
      } else {
        setError("No GR file found for the given details.");
        setGrDetails(null);
      }
    } catch (err) {
      setError("Error fetching GR file. Please try again.");
      console.error(err);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleChatAsk();
  };

  return (
    <Box sx={{ bgcolor: "#f4f6f8", py: 6, px: 2 }}>
      <Box
        display="flex"
        gap={4}
        flexWrap="wrap"
        sx={{ justifyContent: "flex-start" }}
      >
        <Grid item xs={12} md={6} style={{ width: "100%" }}>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: "#1a237e",
              textAlign: "center",
            }}
          >
            Search Government Resolutions
          </Typography>
        </Grid>

        <Paper
          elevation={4}
          sx={{
            borderRadius: 3,
            p: 4,
            backgroundColor: "#fff",
            flex: 1,
            maxWidth: grDetails ? "800px" : "800px",
            width: grDetails ? "100%" : "800px",
            margin: grDetails ? "0" : "0 auto",
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} style={{ width: "100%" }}>
              <FormControl fullWidth>
                <InputLabel id="department-name-label">Department</InputLabel>
                <Select
                  labelId="department-name-label"
                  id="department-select"
                  name="departmentName"
                  value={formValues.departmentName}
                  onChange={handleInputChange}
                  label="Department"
                  sx={{ borderRadius: 2 }}
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
              <FormControl fullWidth>
                <InputLabel id="title-name-label">Title</InputLabel>
                <Select
                  labelId="title-name-label"
                  id="title-select"
                  name="titleName"
                  value={formValues.titleName}
                  onChange={handleInputChange}
                  label="Title"
                  sx={{ borderRadius: 2 }}
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
                value={formValues.unicode}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} style={{ width: "100%" }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  backgroundColor: "#0D9488",
                  "&:hover": {
                    backgroundColor: "#A7F3D0",
                  },
                }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
          {grDetails && (
            <Box mt={6}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Ask Questions About This GR
              </Typography>

              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "#fdfdfd",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
              >
                <Box
                  mt={3}
                  display="flex"
                  gap={2}
                  paddingBottom={2}
                  alignItems="center"
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Ask something about this GR..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    size="medium"
                  />
                  <Button
                    variant="contained"
                    onClick={handleChatAsk}
                    sx={{
                      whiteSpace: "nowrap",
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: "1rem",
                      backgroundColor: "#0D9488",
                    }}
                  >
                    Ask
                  </Button>
                </Box>
                {chatHistory.length > 0 ? (
                  <>
                    <Typography
                      variant="body1"
                      gutterBottom
                      sx={{
                        backgroundColor: "#f1f3f4",
                        color: "#333",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        fontWeight: "500",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <InfoOutlinedIcon sx={{ marginRight: "8px" }} />
                      <strong>Note :</strong>&nbsp; The most recent question is
                      displayed at the top.
                    </Typography>

                    {[...chatHistory].reverse().map((chat, index) => (
                      <Box
                        key={index}
                        mb={2}
                        p={2}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: "#fff",
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          <strong>Question:</strong> {chat.question}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          <strong>Answer:</strong> {chat.answer}
                        </Typography>
                      </Box>
                    ))}
                  </>
                ) : null}
              </Paper>
            </Box>
          )}
        </Paper>
        {grDetails && (
          <Paper
            elevation={4}
            sx={{
              borderRadius: 3,
              p: 4,
              backgroundColor: "#fff",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              flex: 1,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "#2c3e50",
                marginBottom: "25px",
                fontSize: "28px",
                fontWeight: "700",
              }}
              gutterBottom
            >
              GR Details
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: "#333" }}>
                <strong>Department:</strong> {grDetails.english.department}
              </Typography>
              <Typography variant="body1" sx={{ color: "#333" }}>
                <strong>Title:</strong> {grDetails.english.title}
              </Typography>
              <Typography variant="body1" sx={{ color: "#333" }}>
                <strong>Description:</strong> {grDetails.english.description}
              </Typography>
              <Typography variant="body1" sx={{ color: "#333" }}>
                <strong>Date:</strong> {grDetails.english.date}
              </Typography>
              <Typography variant="body1" sx={{ color: "#333" }}>
                <strong>Unicode:</strong> {grDetails.english.unicode}
              </Typography>
              <Typography variant="body1" sx={{ color: "#333" }}>
                <strong>Summary:</strong>
              </Typography>
              {grDetails.english.summary.map((point, index) => (
                <Typography key={index} variant="body1" sx={{ color: "#333" }}>
                  {`${index + 1}. `}
                  {point.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Typography>
              ))}
            </Box>

            {grDetails.grFile && (
              <Box mt={2}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ color: "#555" }}
                >
                  GR File Preview:
                </Typography>
                <iframe
                  title="GR File"
                  src={`data:application/pdf;base64,${grDetails.grFile.replace(
                    /^data:application\/[\w.-]+;base64,/,
                    ""
                  )}#toolbar=1&navpanes=0&scrollbar=1&zoom=100`}
                  style={{
                    width: "100%",
                    height: "500px",
                    border: "1px solid #ccc",
                  }}
                />
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default UserForm;
