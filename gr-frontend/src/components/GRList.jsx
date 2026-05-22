import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TableContainer,
  Button,
  Grid,
  TablePagination,
  TextField,
  IconButton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import UserForm from "./UserForm";
import axios from "axios";

const GRList = () => {
  const [grList, setGrList] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedGR, setSelectedGR] = useState(null);

  const [filters, setFilters] = useState({
    department: "",
    title: "",
    unicode: "",
    date: "",
  });

  const [showFilters, setShowFilters] = useState({
    department: false,
    title: false,
    unicode: false,
    date: false,
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/grListRecords")
      .then((res) => setGrList(res.data))
      .catch((err) => console.error("Failed to fetch GRs", err));
  }, []);

  const handleSearch = (gr) => {
    setSelectedGR(gr);
    setShowUserForm(true);
  };

  const toggleFilter = (column) => {
    setShowFilters((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredGRs = grList.filter((gr) => {
    const department = gr.english?.department?.toLowerCase() || "";
    const title = gr.english?.title?.toLowerCase() || "";
    const unicode = gr.english?.unicode?.toLowerCase() || "";
    const date = gr.english?.date?.toLowerCase() || "";
  
    return (
      department.includes(filters.department.toLowerCase()) &&
      title.includes(filters.title.toLowerCase()) &&
      unicode.includes(filters.unicode.toLowerCase()) &&
      date.includes(filters.date.toLowerCase())
    );
  });

  const paginatedGRs = filteredGRs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ bgcolor: "#f4f6f8", py: 6, px: 2 }}>
      {showUserForm ? (
        <UserForm
          departmentName={selectedGR.english?.department}
          titleName={selectedGR.english?.title}
          unicode={selectedGR.english?.unicode}
        />
      ) : (
        <>
          <Grid container justifyContent="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: "#1a237e",
                  textAlign: "center",
                }}
              >
                All Government Resolutions
              </Typography>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#e0e0e0" }}>
              <TableRow >
                  <TableCell><strong>Sr. No</strong></TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <strong>Department</strong>
                      <IconButton onClick={() => toggleFilter("department")} size="small">
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" >
                      <strong>Title</strong>
                      <IconButton onClick={() => toggleFilter("title")} size="small">
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" >
                      <strong>Unique Code</strong>
                      <IconButton onClick={() => toggleFilter("unicode")} size="small">
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" >
                      <strong>GR Date</strong>
                      <IconButton onClick={() => toggleFilter("date")} size="small">
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>

                  <TableCell><strong>GR File</strong></TableCell>
                </TableRow>

                
                <TableRow>
                  <TableCell />
                  <TableCell>
                    {showFilters.department && (
                      <TextField
                        variant="standard"
                        fullWidth
                        placeholder="Filter Department"
                        value={filters.department}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, department: e.target.value }))
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {showFilters.title && (
                      <TextField
                        variant="standard"
                        fullWidth
                        placeholder="Filter Title"
                        value={filters.title}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {showFilters.unicode && (
                      <TextField
                        variant="standard"
                        fullWidth
                        placeholder="Filter Code"
                        value={filters.unicode}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, unicode: e.target.value }))
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {showFilters.date && (
                      <TextField
                        variant="standard"
                        fullWidth
                        placeholder="Filter Date"
                        value={filters.date}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, date: e.target.value }))
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedGRs.length > 0 ? (
                  paginatedGRs.map((gr, index) => (
                    <TableRow key={index}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{gr.english?.department || "-"}</TableCell>
                      <TableCell>{gr.english?.title || "-"}</TableCell>
                      <TableCell>{gr.english?.unicode || "-"}</TableCell>
                      <TableCell>{gr.english?.date || "-"}</TableCell>
                      <TableCell>
                        {gr.grFile ? (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                              variant="contained"
                              sx={{ backgroundColor: "#0F7A44" }}
                              startIcon={<DownloadIcon />}
                              href={`data:application/pdf;base64,${gr.grFile.replace(/^data:application\/[\w.+-]+;base64,/, "")}`}
                              download={`${gr.english.unicode}.pdf`}
                            >
                              Download
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => handleSearch(gr)}
                              sx={{
                                backgroundColor: "#0D9488",
                                "&:hover": {
                                  backgroundColor: "#A7F3D0",
                                },
                              }}
                            >
                              View Details
                            </Button>
                          </Box>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No GR records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredGRs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default GRList;
