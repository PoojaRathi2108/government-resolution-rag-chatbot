import { Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import React from "react";

const ThreadQueries = ({ chatHistory, isLoading, theme, handleChatAsk, handleKeyPress, chatInput, setChatInput }) => {
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor:
            theme.palette.mode === "dark" ? "#1e1e1e" : "#fdfdfd",
          maxHeight: "60vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          ...(chatHistory.length === 0 &&
            !isLoading && { textAlign: "center" }),
          scrollbarWidth: "thin",
          scrollbarColor:
            theme.palette.mode === "dark" ? "#888 #1e1e1e" : "#ccc #fdfdfd",

          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme.palette.background.paper,
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.mode === "dark" ? "#555" : "#aaa",
            borderRadius: "8px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: theme.palette.mode === "dark" ? "#777" : "#888",
          },
        }}
      >
        {chatHistory.map((chat, index) => (
          <Box key={index} mb={3}>
            {/* Question */}
            <Box
              sx={{
                p: 2,
                bgcolor:
                  theme.palette.mode === "dark" ? "#0d948850" : "#e0f7fa",
                borderRadius: 3,
                maxWidth: "85%",
                alignSelf: "flex-end",
                ml: "auto",
              }}
            >
              <Typography variant="body1">
                <strong>प्रश्न:</strong> {chat.query_text}
              </Typography>
            </Box>

            {chat.response_text && (
              <Box
                mt={1}
                sx={{
                  p: 2,
                  bgcolor:
                    theme.palette.mode === "dark" ? "#2b2b2b" : "#f1f3f4",
                  borderRadius: 3,
                  maxWidth: "85%",
                  alignSelf: "flex-start",
                  mr: "auto",
                }}
              >
                <Typography
                  variant="body1"
                  dangerouslySetInnerHTML={{ __html: chat.response_text }}
                />
              </Box>
            )}
          </Box>
        ))}
        {isLoading && (
          <Box mt={1} display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} color="primary" />
            <Typography variant="body2">Just a moment...</Typography>
          </Box>
        )}
      </Paper>

      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          mt: 2,
          borderRadius: "24px",
          position: "sticky",
          bottom: 0,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Please Ask Queries..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyPress}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "20px",
                paddingRight: "8px",
                alignItems: "flex-start",
              },
            }}
          />

          <Button
            variant="contained"
            onClick={handleChatAsk}
            disabled={isLoading || !chatInput.trim()}
            sx={{
              minWidth: "48px",
              height: "48px",
              borderRadius: "50%",
              p: 0,
            }}
          >
            ➤
          </Button>
        </Box>
      </Paper>
    </>
  );
};

export default ThreadQueries;
