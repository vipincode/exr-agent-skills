import { useUsers } from "../hooks/useUsers";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
export default function UsersPage() {
  const { users, isLoading } = useUsers();
  if (isLoading) return <p>Loading…</p>;
  return (<div><PageHeader title="Users" />{users?.map((u) => <Card key={u.id} title={u.name}>{u.email}</Card>)}</div>);
}
