import { useFormik } from "formik";
import { TextField, Button } from "@mui/material";
import { loginSchema } from "../../schemas/userSchema";
import { apiClient } from "../../api/client";
export function LoginForm() {
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values) => { await apiClient.post("/auth/login", values); },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField name="email" label="Email" value={formik.values.email} onChange={formik.handleChange}
        error={!!formik.errors.email} helperText={formik.errors.email} />
      <TextField name="password" type="password" label="Password" value={formik.values.password} onChange={formik.handleChange} />
      <Button type="submit">Sign in</Button>
    </form>
  );
}
