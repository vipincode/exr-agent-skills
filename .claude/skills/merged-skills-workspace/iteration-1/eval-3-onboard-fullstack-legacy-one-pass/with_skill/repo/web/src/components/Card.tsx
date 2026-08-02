import { Card as MuiCard, CardContent, Typography } from "@mui/material";
// Generic shared wrapper around MUI Card.
export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (<MuiCard><CardContent><Typography variant="h6">{title}</Typography>{children}</CardContent></MuiCard>);
}
