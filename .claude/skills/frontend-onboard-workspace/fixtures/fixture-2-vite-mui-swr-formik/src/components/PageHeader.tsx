import { Typography, Box } from "@mui/material";
export function PageHeader({ title }: { title: string }) {
  return (<Box mb={2}><Typography variant="h4">{title}</Typography></Box>);
}
