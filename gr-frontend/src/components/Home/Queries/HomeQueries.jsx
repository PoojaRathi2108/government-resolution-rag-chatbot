import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  CssBaseline,
  Paper,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import sanitizeHtml from "sanitize-html";
import axios from "axios";
import { Brightness4, Brightness7, Stop } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MAX_CHATS } from "../../../const/departments";
import { greetings } from "../../../const/greetings";

const API_BASE_URL = "https://gr-backend-latest.onrender.com/api";
const LOCAL_API_URL = "http://localhost:5000/api";

const HomeQueries = ({
  darkMode,
  setDarkMode,
  isNew,
  setIsNew,
  session_id,
  dummyData,
  selectedIndex,
  setChatHistory,
  chatHistory,
  setSelectedIndex,
}) => {
  // Simplified state management
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(session_id);
  const [abortController, setAbortController] = useState(null);
  const [accumulatedResponse, setAccumulatedResponse] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [finalSources, setFinalSources] = useState([]);

  const { user } = useSelector((state) => state?.user);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  // Memoized theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: "#0D9488" },
          background: {
            default: darkMode ? "#2b2b2b" : "#f4f6f8",
            paper: darkMode ? "#1e1e1e" : "#ffffff",
          },
        },
        shape: { borderRadius: 12 },
      }),
    [darkMode]
  );

  // Sync session_id with currentSessionId
  useEffect(() => {
    setCurrentSessionId(session_id);
  }, [session_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isStreaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isStreaming]);

  // Update chat history when dummyData changes
  useEffect(() => {
    if (selectedIndex >= 0 && dummyData) {
      setChatHistory((prev) => {
        const newChatHistory = [...prev];
        if (newChatHistory[selectedIndex]) {
          newChatHistory[selectedIndex] = {
            ...newChatHistory[selectedIndex],
            entries: dummyData || [],
          };
        }
        return newChatHistory;
      });
    }
  }, [selectedIndex, dummyData, setChatHistory]);

  // Handle URL-based session selection
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/chat/new") {
      setIsNew(true);
      setSelectedIndex(-1);
      setCurrentSessionId("new");
    } else if (path.startsWith("/chat/")) {
      const sessionId = path.split("/chat/")[1];
      const index = chatHistory.findIndex(
        (chat) => chat._id === sessionId || chat._id === `temp-${sessionId}`
      );
      if (index !== -1) {
        setSelectedIndex(index);
        setIsNew(false);
        setCurrentSessionId(sessionId);
      } else {
        setSelectedIndex(-1);
        setIsNew(true);
        setCurrentSessionId("new");
      }
    }
  }, [chatHistory, setIsNew, setSelectedIndex]);

  // Utility functions
  const isChatLimitReached = useCallback(() => {
    return (chatHistory[selectedIndex]?.entries?.length || 0) >= MAX_CHATS;
  }, [chatHistory, selectedIndex]);

  const formatResponse = useCallback((text) => {
    const keywords = [
      "GR क्रमांक:",
      "विभाग:",
      "पूर्ण GR:",
      "शासन निर्णय:",
      "संबंधित माहिती:",
      "प्रस्तावना :",
      "निर्णय :",
      "संदर्भ:",
      "नियम:",
      "मजकूर:",
      "अटी:",
      "नोंद:",
    ];

    // Split text into sections based on the --- separator
    const sections = text.split(/\n---\n/);

    // Process each section individually
    const processedSections = sections.map((section) => {
      // Remove invalid or empty GR क्रमांक lines
      return section
        .replace(/GR क्रमांक:\s*UNKNOWN\s*\n/gi, "")
        .replace(/GR क्रमांक:\s*\n/gi, "")
        .replace(/GR क्रमांक:\s*-\s*\n/gi, "");
    });

    // Join the sections back together
    let processedText = processedSections.join("\n---\n");

    let formatted = processedText
      .replace(/^उत्तर:\s*/i, "")
      .replace(/\*\*(.*?)\*\*/g, (match, text) => {
        const isKeyword = keywords.some((keyword) => text.startsWith(keyword));
        return isKeyword
          ? `<br><strong>${text}</strong>`
          : `<strong>${text}</strong>`;
      })
      .replace(/\n/g, "<br>");

    return sanitizeHtml(formatted, {
      allowedTags: ["br", "strong"],
      allowedAttributes: {},
    });
  }, []);

  const extractTitleFromResponse = useCallback((responseText) => {
    const match = responseText.match(/शीर्षक:\s*(.+)/);
    return match ? match[1].trim().replace(/\*\*/g, "") : null;
  }, []);

  const getSmartSessionTitle = useCallback((queryText, responseText) => {
    const cleanQuery = queryText.replace(/\?.*$/, "").trim();
    const responseLine = responseText.split("\n")[0].slice(0, 80);

    if (cleanQuery && responseLine) {
      return cleanQuery + " - " + responseLine.slice(0, 40) + "...";
    }
    return cleanQuery || responseLine || "Untitled Session";
  }, []);

  const isGreeting = useCallback((input) => {
    const lowerInput = input.toLowerCase().trim();
    return greetings.find((greeting) =>
      greeting.patterns.some((pattern) => lowerInput.includes(pattern))
    );
  }, []);

  const getGreetingResponse = useCallback((greeting) => {
    const responses = greeting.responses;
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // API functions
  const refreshChatHistory = useCallback(async () => {
    try {
      const userId = user?.user?._id;
      const response = await axios.get(
        `${API_BASE_URL}/getAllChatHistory?userId=${userId}`
      );
      const sessions = response.data.session || [];
      setChatHistory(sessions);

      if (currentSessionId && currentSessionId !== "new") {
        const newIndex = sessions.findIndex(
          (chat) => chat._id === currentSessionId
        );
        if (newIndex !== -1) {
          setSelectedIndex(newIndex);
        } else {
          setSelectedIndex(-1);
          setIsNew(true);
          setCurrentSessionId("new");
        }
      }
    } catch (err) {
      console.error("Error refreshing chat history:", err);
    }
  }, [
    user?.user?._id,
    currentSessionId,
    setChatHistory,
    setSelectedIndex,
    setIsNew,
  ]);

  const saveToMongoDB = useCallback(
    async (queryText, responseText, sources, isGreeting = []) => {
      const finalEntry = {
        query_text: queryText,
        response_text: formatResponse(responseText),
        sources: sources,
        status: "success",
        createdAt: new Date().toISOString(),
      };

      try {
        const sessionTitle = getSmartSessionTitle(queryText, responseText);

        if (
          isNew ||
          currentSessionId.startsWith("new-") ||
          currentSessionId === "new"
        ) {
          const extractedTitle = extractTitleFromResponse(responseText);

          const createResponse = await axios.put(
            `${API_BASE_URL}/createChatHistory`,
            {
              userId: user?.user?._id,
              session_title:
                isGreeting === "greeting"
                  ? "greeting"
                  : extractedTitle || sessionTitle + "...",
              entries: [finalEntry],
              isDeleted: false,
              startedAt: new Date().toISOString(),
            }
          );

          if (createResponse.data.id) {
            const newSessionId = createResponse.data.id;
            setCurrentSessionId(newSessionId);
            setIsNew(false);
            navigate(`/chat/${newSessionId}`);

            const newSession = {
              _id: newSessionId,
              session_title: sessionTitle + "...",
              entries: [finalEntry],
              startedAt: new Date().toISOString(),
              userId: user?.user?._id || "unknown",
              isDeleted: false,
            };

            setChatHistory((prev) => {
              const newChatHistory = [...prev, newSession];
              setSelectedIndex(newChatHistory.length - 1);
              return newChatHistory;
            });

            setTimeout(() => refreshChatHistory(), 1000);
          }
        } else {
          if (
            chatHistory.find((chat) => chat._id === currentSessionId)
              ?.session_title === "greeting"
          ) {
            const extractedTitle = extractTitleFromResponse(responseText);
            await axios.post(`${API_BASE_URL}updateChatHistory`, {
              session_id: currentSessionId,
              session_title: extractedTitle || sessionTitle + "...",
              new_entries: [finalEntry],
            });
          } else {
            await axios.post(`${API_BASE_URL}/updateChatHistory`, {
              session_id: currentSessionId,
              new_entries: [finalEntry],
            });
          }
          await refreshChatHistory();
        }
      } catch (error) {
        console.error("Error saving to MongoDB:", error);
      }
    },
    [
      formatResponse,
      getSmartSessionTitle,
      extractTitleFromResponse,
      isNew,
      currentSessionId,
      user?.user?._id,
      navigate,
      setCurrentSessionId,
      setIsNew,
      setChatHistory,
      setSelectedIndex,
      refreshChatHistory,
    ]
  );

  // Reset session state
  const resetSessionState = useCallback(() => {
    setIsLoading(false);
    setIsStreaming(false);
    setAbortController(null);
    setAccumulatedResponse("");
    setCurrentQuery("");
    setFinalSources([]);
  }, []);

  // Handle stop streaming
  const handleStopStreaming = useCallback(async () => {
    if (abortController) {
      abortController.abort();
    }

    setIsStreaming(false);
    setIsLoading(false);

    // Update chat history with stopped status
    setChatHistory((prev) => {
      const newChatHistory = [...prev];
      const chatIndex = newChatHistory.findIndex(
        (chat) => chat._id === currentSessionId
      );

      if (chatIndex !== -1) {
        const updatedEntries = [...newChatHistory[chatIndex].entries];
        const lastEntry = updatedEntries[updatedEntries.length - 1];

        if (lastEntry?.isStreaming) {
          updatedEntries[updatedEntries.length - 1] = {
            ...lastEntry,
            response_text: formatResponse(accumulatedResponse),
            sources: finalSources,
            status: "stopped",
            isStreaming: false,
          };
          newChatHistory[chatIndex] = {
            ...newChatHistory[chatIndex],
            entries: updatedEntries,
          };
        }
      }
      return newChatHistory;
    });

    if (accumulatedResponse && currentQuery) {
      await saveToMongoDB(currentQuery, accumulatedResponse, finalSources);
    }

    resetSessionState();
  }, [
    abortController,
    currentSessionId,
    formatResponse,
    accumulatedResponse,
    finalSources,
    currentQuery,
    saveToMongoDB,
    resetSessionState,
    setChatHistory,
  ]);

  // Simulate greeting response
  const simulateGreetingResponse = useCallback(
    async (query, response) => {
      const sessionId = currentSessionId;
      setIsStreaming(true);
      setCurrentQuery(query);
      setAccumulatedResponse("");
      setFinalSources([]);
      setIsLoading(true);

      const controller = new AbortController();
      setAbortController(controller);

      const placeholderEntry = {
        query_text: query,
        response_text: "",
        sources: [],
        status: "loading",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      // Insert greeting response into chat history
      setChatHistory((prev) => {
        const newChatHistory = [...prev];
        let chatIndex = newChatHistory.findIndex(
          (chat) => chat._id === sessionId
        );

        if (chatIndex === -1) {
          const newSessionId = "new-" + Date.now();
          setCurrentSessionId(newSessionId);
          setIsNew(true);
          navigate(`/chat/${newSessionId}`);

          const newChat = {
            _id: newSessionId,
            session_title: "New Chat...",
            entries: [placeholderEntry],
            startedAt: new Date().toISOString(),
            userId: user?.user?._id || "unknown",
            isDeleted: false,
          };

          newChatHistory.push(newChat);
          setSelectedIndex(newChatHistory.length - 1);
        } else {
          newChatHistory[chatIndex] = {
            ...newChatHistory[chatIndex],
            entries: [...newChatHistory[chatIndex].entries, placeholderEntry],
          };
        }

        return newChatHistory;
      });

      // Simulate streaming
      let accumulated = "";
      const words = response.split(" ");
      const delay = 5000 / words.length;

      try {
        for (const word of words) {
          if (controller.signal.aborted) break;

          await new Promise((resolve) => setTimeout(resolve, delay));
          accumulated += (accumulated ? " " : "") + word;
          setAccumulatedResponse(accumulated);

          setChatHistory((prev) => {
            const newChatHistory = [...prev];
            const chatIndex = newChatHistory.findIndex(
              (chat) => chat._id === sessionId
            );

            if (chatIndex !== -1) {
              const updatedEntries = [...newChatHistory[chatIndex].entries];
              const lastEntry = updatedEntries[updatedEntries.length - 1];

              if (lastEntry?.isStreaming) {
                updatedEntries[updatedEntries.length - 1] = {
                  ...lastEntry,
                  response_text: formatResponse(accumulated),
                  status: "streaming",
                };
              }
              newChatHistory[chatIndex] = {
                ...newChatHistory[chatIndex],
                entries: updatedEntries,
              };
            }

            return newChatHistory;
          });
        }

        // Save the greeting response
        await saveToMongoDB(query, accumulated, [], "greeting");
      } catch (error) {
        console.error("Greeting simulation failed:", error);
      } finally {
        if (!controller.signal.aborted) {
          resetSessionState();
        }
      }
    },
    [
      currentSessionId,
      user?.user?._id,
      navigate,
      setCurrentSessionId,
      setIsNew,
      setChatHistory,
      setSelectedIndex,
      formatResponse,
      saveToMongoDB,
      resetSessionState,
    ]
  );

  // Main chat handler
  const handleChatAsk = useCallback(async () => {
    if (!chatInput.trim()) return;

    if (!isNew && isChatLimitReached()) {
      alert(
        `You have reached the maximum limit of ${MAX_CHATS} conversations. Please start a new chat session.`
      );
      return;
    }

    const newQuestion = chatInput;
    setChatInput("");

    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 200);
    // Check if it's a greeting
    const greeting = isGreeting(newQuestion);
    if (greeting) {
      const response = getGreetingResponse(greeting);
      await simulateGreetingResponse(newQuestion, response);
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setCurrentQuery(newQuestion);
    setAccumulatedResponse("");
    setFinalSources([]);

    const controller = new AbortController();
    setAbortController(controller);

    const placeholderEntry = {
      query_text: newQuestion,
      response_text: "",
      sources: [],
      status: "loading",
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    // Update chat history with new question
    setChatHistory((prev) => {
      let newSessionId = currentSessionId;
      let newChatHistory = [...prev];

      if (isNew || currentSessionId === "new") {
        newSessionId = "new-" + Date.now();
        const newChat = {
          _id: newSessionId,
          session_title: "New Chat...",
          entries: [placeholderEntry],
          startedAt: new Date().toISOString(),
          userId: user?.user?._id || "unknown",
          isDeleted: false,
        };
        newChatHistory = [...newChatHistory, newChat];
        setCurrentSessionId(newSessionId);
        const newIndex = newChatHistory.findIndex(
          (chat) => chat._id === newSessionId
        );
        setSelectedIndex(newIndex);
        navigate(`/chat/${newSessionId}`);
      } else {
        const chatIndex = newChatHistory.findIndex(
          (chat) => chat._id === currentSessionId
        );
        if (chatIndex !== -1) {
          newChatHistory[chatIndex] = {
            ...newChatHistory[chatIndex],
            entries: [
              ...(newChatHistory[chatIndex].entries || []),
              placeholderEntry,
            ],
          };
        }
      }
      return newChatHistory;
    });

    try {
      const currentTitle =
        chatHistory.find((chat) => chat._id === currentSessionId)
          ?.session_title || "";
      const userId = user?.user?._id;
      const response = await fetch(`${API_BASE_URL}/askQueries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: newQuestion,
          user_id: userId,
          session_id: currentTitle === "greeting" ? "new" : currentSessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let bufferedData = "";
      let currentAccumulatedResponse = "";
      let currentFinalSources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferedData += decoder.decode(value, { stream: true });
        let lines = bufferedData.split("\n");
        bufferedData = lines.pop();

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.status === "streaming") {
              currentAccumulatedResponse += data.response;
              setAccumulatedResponse(currentAccumulatedResponse);

              setChatHistory((prev) => {
                const newChatHistory = [...prev];
                // const chatIndex = newChatHistory.findIndex(chat => chat._id === currentSessionId);
                const chatIndex = isNew
                  ? chatHistory.length
                  : newChatHistory.findIndex(
                      (chat) => chat._id === currentSessionId
                    );

                if (chatIndex !== -1) {
                  const updatedEntries = [...newChatHistory[chatIndex].entries];
                  const lastEntry = updatedEntries[updatedEntries.length - 1];

                  if (lastEntry?.isStreaming) {
                    updatedEntries[updatedEntries.length - 1] = {
                      ...lastEntry,
                      response_text: formatResponse(currentAccumulatedResponse),
                      status: "streaming",
                    };
                  }
                  newChatHistory[chatIndex] = {
                    ...newChatHistory[chatIndex],
                    entries: updatedEntries,
                  };
                }
                return newChatHistory;
              });
            } else if (data.status === "success" && data.done) {
              currentFinalSources = data.sources || [];
              setFinalSources(currentFinalSources);

              setChatHistory((prev) => {
                const newChatHistory = [...prev];
                const chatIndex = newChatHistory.findIndex(
                  (chat) => chat._id === currentSessionId
                );

                if (chatIndex !== -1) {
                  const updatedEntries = [...newChatHistory[chatIndex].entries];
                  const lastEntry = updatedEntries[updatedEntries.length - 1];

                  if (lastEntry) {
                    updatedEntries[updatedEntries.length - 1] = {
                      ...lastEntry,
                      response_text: formatResponse(currentAccumulatedResponse),
                      sources: currentFinalSources,
                      status: "success",
                      isStreaming: false,
                    };
                  }
                  newChatHistory[chatIndex] = {
                    ...newChatHistory[chatIndex],
                    entries: updatedEntries,
                  };
                }
                return newChatHistory;
              });

              await saveToMongoDB(
                newQuestion,
                currentAccumulatedResponse,
                currentFinalSources
              );
              resetSessionState();
              break;
            } else if (data.status === "error") {
              throw new Error(data.response);
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }

      const errorMessage = sanitizeHtml(
        `Server Error: ${error.message}`.replace(
          /\*\*(.*?)\*\*/g,
          "<strong>$1</strong>"
        ),
        { allowedTags: ["strong"], allowedAttributes: {} }
      );

      setChatHistory((prev) => {
        const newChatHistory = [...prev];
        const chatIndex = newChatHistory.findIndex(
          (chat) => chat._id === currentSessionId
        );

        if (chatIndex !== -1) {
          const updatedEntries = [...newChatHistory[chatIndex].entries];
          const lastEntry = updatedEntries[updatedEntries.length - 1];

          if (lastEntry) {
            updatedEntries[updatedEntries.length - 1] = {
              ...lastEntry,
              response_text: errorMessage,
              sources: [],
              status: "error",
              isStreaming: false,
            };
          }
          newChatHistory[chatIndex] = {
            ...newChatHistory[chatIndex],
            entries: updatedEntries,
          };
        }
        return newChatHistory;
      });

      console.error("Chat error:", error);
    } finally {
      if (!controller.signal.aborted) {
        resetSessionState();
      }
    }
  }, [
    chatInput,
    isNew,
    isChatLimitReached,
    isGreeting,
    getGreetingResponse,
    simulateGreetingResponse,
    currentSessionId,
    user?.user?._id,
    navigate,
    setCurrentSessionId,
    setSelectedIndex,
    setChatHistory,
    formatResponse,
    saveToMongoDB,
    resetSessionState,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming) {
          handleChatAsk();
        }
      }
    },
    [isStreaming, handleChatAsk]
  );

  const currentChat = chatHistory[selectedIndex];
  const showWelcome =
    isNew &&
    (!currentChat?.entries?.length || selectedIndex === -1) &&
    !isLoading;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: "background.default", minHeight: "85vh" }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={4}
          >
            <Typography variant="h4" fontWeight="bold">
              GR Chat Assistant
            </Typography>
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>

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
              scrollbarWidth: "thin",
              scrollbarColor:
                theme.palette.mode === "dark" ? "#888 #1e1e1e" : "#ccc #fdfdfd",
              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-track": {
                background: theme.palette.background.paper,
                borderRadius: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#555" : "#aaa",
                borderRadius: "8px",
                border: "2px solid transparent",
                backgroundClip: "content-box",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#777" : "#888",
              },
            }}
          >
            {showWelcome ? (
              <>
                <Typography variant="h4" sx={{ mt: 4, textAlign: "center" }}>
                  Hello {user?.user?.name}!<br /> How can I help with?
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
                  I am AI-GR, here to assist you with any queries related to
                  Government Resolutions (GRs)
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
                  issued by the Government of Maharashtra.
                </Typography>
              </>
            ) : (
              currentChat?.entries?.map((chat, index) => (
                <Box key={index} mb={3}>
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

                  {chat.status === "loading" ||
                  (chat.status === "streaming" && !chat.response_text) ? (
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
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={20} color="primary" />
                      <Typography variant="body2">Just a moment...</Typography>
                    </Box>
                  ) : (
                    chat.response_text && (
                      <Box
                        mt={1}
                        sx={{
                          p: 2,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "#2b2b2b"
                              : "#f1f3f4",
                          borderRadius: 3,
                          maxWidth: "85%",
                          alignSelf: "flex-start",
                          mr: "auto",
                        }}
                      >
                        <Typography
                          variant="body1"
                          dangerouslySetInnerHTML={{
                            __html: chat.response_text,
                          }}
                        />
                        {chat.status === "stopped" && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontStyle: "italic",
                              display: "block",
                              mt: 1,
                            }}
                          >
                            Response stopped by user
                          </Typography>
                        )}
                      </Box>
                    )
                  )}
                </Box>
              ))
            )}

            {!isNew && isChatLimitReached() && !isStreaming && (
              <Typography
                variant="body2"
                sx={{
                  color: "error.main",
                  textAlign: "center",
                  mb: 2,
                  fontWeight: "bold",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#2e2e2e" : "#f8d7da",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                🚫 Maximum limit of {MAX_CHATS} conversations reached. Please
                start a new chat session to continue.
              </Typography>
            )}
            <div ref={bottomRef} />
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
                multiline
                maxRows={4}
                disabled={isStreaming || (!isNew && isChatLimitReached())}
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
                onClick={isStreaming ? handleStopStreaming : handleChatAsk}
                disabled={
                  !isStreaming &&
                  (!chatInput.trim() || (!isNew && isChatLimitReached()))
                }
                sx={{
                  minWidth: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  p: 0,
                  bgcolor: isStreaming
                    ? "#f44336"
                    : !isNew && isChatLimitReached()
                    ? "grey.400"
                    : "primary.main",
                  "&:hover": {
                    bgcolor: isStreaming
                      ? "#d32f2f"
                      : !isNew && isChatLimitReached()
                      ? "grey.400"
                      : "primary.dark",
                  },
                }}
              >
                {isStreaming ? <Stop /> : "➤"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default HomeQueries;
