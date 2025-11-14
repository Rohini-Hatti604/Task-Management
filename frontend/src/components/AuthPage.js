import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Paper, Typography, TextField, Button, Alert } from "@mui/material";
import { loginUser, signupUser } from "../store/authSlice";
import { useLocation, useNavigate } from "react-router-dom";

const AuthPage = ({ mode = "signup" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const redirectTo = params.get("redirect") || "/";
  const invitedEmail = params.get("email") || "";
  const invitedProject = params.get("project");

  const { loading, error, signupSuccess, token } = useSelector((state) => state.auth);

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [formData, setFormData] = useState({ name: "", email: invitedEmail, password: "", userPhoto: "" });

  useEffect(() => {
    setIsLogin(mode === "login");
  }, [mode]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, email: invitedEmail }));
  }, [invitedEmail]);

  useEffect(() => {
    if (signupSuccess && !isLogin) {
      setIsLogin(true);
    }
  }, [signupSuccess, isLogin]);

  useEffect(() => {
    if (token) {
      navigate(redirectTo, { replace: true });
    }
  }, [token, navigate, redirectTo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      dispatch(loginUser({ email: formData.email, password: formData.password }));
    } else {
      dispatch(signupUser(formData));
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper elevation={4} sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {isLogin ? "Welcome back" : "Create your account"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isLogin ? "Log in to access your projects." : "Sign up to collaborate on Kanban boards."}
        </Typography>

        {invitedProject && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You have been invited to join a project. Complete your account to continue.
          </Alert>
        )}

        {signupSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Account created! Please log in to continue.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Photo URL (optional)"
                name="userPhoto"
                value={formData.userPhoto}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </>
          )}

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {isLogin ? "Login" : "Sign Up"}
          </Button>
          <Button
            type="button"
            fullWidth
            sx={{ mt: 1 }}
            onClick={toggleMode}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthPage;
