import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  createTheme,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthTabs from "./AuthTabs";
import { departments } from "../../constants";
import axios from "axios";
import { showError, showSuccess } from "../../utils/toast";
import { useDispatch, useSelector } from "react-redux";
import { loginStart, loginSuccess } from "../../Redux/features/user/userSlice";
import { useNavigate } from "react-router-dom";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

// Zod Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z
  .object({
    department: z.string().min(1, "Department is required"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
    mobileNumber: z
      .string()
      .regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const AuthForm = () => {
  const [tab, setTab] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(tab === 0 ? loginSchema : signupSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    const validate = async () => {
      if (token && user) {
        try {
          const res = await axios.get("https://gr-backend-latest.onrender.com/api/check-token", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // console.log("Token valid:", res.data);
          dispatch(loginSuccess(JSON.parse(user)));
          navigate("/");
        } catch (error) {
          console.error(
            "Token check failed:",
            error.response?.data || error.message
          );
          localStorage.removeItem("token"); // clear invalid token
          localStorage.removeItem("user"); // clear invalid token
        }
      }
    };
    validate();
  }, []); // Add dependencies!

  const onSubmit = async (data) => {
    if (tab === 1) {
      try {
        const res = await axios.post("https://gr-backend-latest.onrender.com/api/signup", data, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.data.success) {
          showSuccess("Signup successful!");
          navigate("/auth");
        }
      } catch (error) {
        showError(error.response?.data?.message || error.message);
      }
    } else if (tab === 0) {
      dispatch(loginStart());
      try {
        const res = await axios.post("https://gr-backend-latest.onrender.com/api/login", data);
        console.log(res);
        if (res.data.message === "Login successful") {
          localStorage.setItem("token", res.data.access_token);
          localStorage.setItem("user", JSON.stringify(res.data));
          dispatch(loginSuccess(res.data));
          showSuccess("Login successful!");
          navigate("/");
        } else if (res.status === 401) {
          console.log("Error:", res.data.message);
          showError("Invalid email or password!!");
          setError("password", {
            type: "manual",
            message: "Invalid email or password!!", // this will appear in helperText
          });
        }
      } catch (error) {
        setError("email", {
          type: "manual",
          message: "Invalid email or password!!", // this will appear in helperText
        });
        setError("password", {
          type: "manual",
          message: "Invalid email or password!!", // this will appear in helperText
        });
        showError("Invalid email or password!!");
      }
    }
  };

  return (
    <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "95vh",
      py: 1,
      mt: 0,
      backgroundImage: 'url(/login.png)', 
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }}
  >
      <Paper
        elevation={6}
        sx={{
          width: 400,
          p: 4,
          borderRadius: 3,
          backgroundColor: "white",
        }}
      >
        <AuthTabs tab={tab} setTab={setTab} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {tab === 1 && (
            <>
              <TextField
                select
                label="Department"
                fullWidth
                margin="normal"
                {...register("department")}
                error={!!errors.department}
                helperText={errors.department?.message}
              >
                {departments.map((dept, index) => (
                  <MenuItem key={index} value={dept.value}>
                    {dept.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Name"
                fullWidth
                margin="normal"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </>
          )}

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {tab === 1 && (
            <>
              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                {...register("confirmPassword")}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Mobile Number"
                fullWidth
                margin="normal"
                {...register("mobileNumber")}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber?.message}
              />
            </>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: "#009688",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#00796B" },
            }}
          >
            {tab === 0 ? "Login" : "Sign Up"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AuthForm;
