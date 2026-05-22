import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const AdminUserPanel = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddOrUpdateUser = () => {
    if (editingUser !== null) {
      const updatedUsers = [...users];
      updatedUsers[editingUser] = {
        ...formData,
        active: users[editingUser].active,
      };
      setUsers(updatedUsers);
      setEditingUser(null);
    } else {
      setUsers([...users, { ...formData, active: true }]);
    }
    setFormData({ department: "", name: "", email: "" });
    setDialogOpen(false);
  };

  const handleEdit = (index) => {
    setEditingUser(index);
    setFormData({
      department: users[index].department,
      name: users[index].name,
      email: users[index].email,
    });
    setDialogOpen(true);
  };

  const handleDelete = (index) => {
    const updatedUsers = users.filter((_, i) => i !== index);
    setUsers(updatedUsers);
  };

  const toggleActive = (index) => {
    const updatedUsers = [...users];
    updatedUsers[index].active = !updatedUsers[index].active;
    setUsers(updatedUsers);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "90vh" }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          User Management Panel
        </Typography>

        <Button
          variant="contained"
          sx={{ mb: 3, fontWeight: 600 }}
          onClick={() => setDialogOpen(true)}
        >
          + Add New User
        </Button>

        <Paper elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.active}
                      onChange={() => toggleActive(index)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(index)}>
                      <EditRoundedIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(index)}
                      color="error"
                    >
                      <DeleteRoundedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>
            {editingUser !== null ? "Update User" : "Add User"}
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <TextField
              name="department"
              label="Department"
              value={formData.department}
              sx={{
                marginTop: "8px",
              }}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddOrUpdateUser} variant="contained">
              {editingUser !== null ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AdminUserPanel;
