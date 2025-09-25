import CustomerDetailClient from "./CustomerDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailClient id={Number(id)} />;
}
