import { Box, Button, Paper, TextField, Typography } from "@mui/material";

const NewQueries = ({
  user,
  chatInput,
  setChatInput,
  handleKeyPress,
  handleChatAsk,
  isLoading,
  theme,
  chatHistory,
}) => {
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
        <Typography variant="h4" sx={{ mt: 4 }}>
          Hello {user?.user?.name}!<br /> How can I help with?
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          I am AI-GR, here to assist you with any queries related to Government
          Resolutions (GRs)
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          issued by the Government of Maharashtra.
        </Typography>
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

export default NewQueries;
