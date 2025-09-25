"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import rivhit from "@/lib/rivhit";

interface DashboardStats {
  totalCustomers: number;
  totalItems: number;
  totalDocuments: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalItems: 0,
    totalDocuments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [customersResponse, itemsResponse, documentsResponse] = await Promise.all([
        rivhit.customers.list(),
        rivhit.items.list(),
        rivhit.documents.list({}),
      ]);

      const customersList = customersResponse.data?.data?.customer_list || [];
      const customersCount = customersList.filter((c: any) => Number(c?.customer_id ?? 0) >= 64).length;

      const itemsList = itemsResponse.data?.data?.item_list || [];
      // סה"כ מלאי בסיכום הפריטים: סכום הכמויות, לא מספר הסוגים
      const itemsCount = itemsList.reduce((sum: number, it: any) => sum + Number(it?.quantity ?? 0), 0);
      const documents = documentsResponse.data?.data?.document_list || [];
      const documentsCount = documents.length;
      const totalRevenue = documents.reduce((sum: number, doc: any) => sum + (doc?.amount || 0), 0);

      setStats({
        totalCustomers: customersCount,
        totalItems: itemsCount,
        totalDocuments: documentsCount,
        totalRevenue: totalRevenue,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("שגיאה בטעינת נתוני הדשבורד");
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "סה\"כ לקוחות",
      value: stats.totalCustomers.toLocaleString(),
      icon: <PeopleIcon />,
      color: "#1976d2",
      change: "+12%",
    },
    {
      title: "סה\"כ פריטים",
      value: stats.totalItems.toLocaleString(),
      icon: <InventoryIcon />,
      color: "#388e3c",
      change: "+8%",
    },
    {
      title: "סה\"כ מסמכים",
      value: stats.totalDocuments.toLocaleString(),
      icon: <DescriptionIcon />,
      color: "#f57c00",
      change: "+15%",
    },
    {
      title: "סה\"כ הכנסות",
      value: `₪${stats.totalRevenue.toLocaleString()}`,
      icon: <MoneyIcon />,
      color: "#7b1fa2",
      change: "+23%",
    },
  ];

  const recentActivity = [
    { action: "מכירה חדשה", customer: "ישראל ישראלי", amount: "₪1,250", time: "לפני 5 דקות" },
    { action: "קבלה חדשה", customer: "שרה כהן", amount: "₪890", time: "לפני 15 דקות" },
    { action: "פריט חדש נוסף", item: "מוצר חדש", time: "לפני 30 דקות" },
    { action: "לקוח חדש נרשם", customer: "דוד לוי", time: "לפני שעה" },
  ];

  const lowStockItems = [
    { name: "נייר A4", stock: 5, minStock: 20 },
    { name: "עט כחול", stock: 3, minStock: 15 },
    { name: "קלסר", stock: 8, minStock: 25 },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        דשבורד
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3} mb={3}>
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            onClick={() => {
              if (index === 0) router.push("/customers");
              if (index === 1) router.push("/items");
            }}
            sx={{ cursor: index === 0 || index === 1 ? "pointer" : "default" }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stat.value}
                  </Typography>
                  <Chip label={stat.change} color="success" size="small" icon={<TrendingUpIcon />} />
                </Box>
                <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>{stat.icon}</Avatar>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              פעילות אחרונה
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar>
                      <TrendingUpIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.action}
                    secondary={
                      activity.customer
                        ? `${activity.customer} - ${activity.amount}`
                        : activity.item
                        ? activity.item
                        : ""
                    }
                  />
                  <Typography variant="caption" color="textSecondary">
                    {activity.time}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              מלאי נמוך
            </Typography>
            <List>
              {lowStockItems.map((item, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "error.main" }}>
                      <WarningIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    secondary={`מלאי נוכחי: ${item.stock} | מינימום: ${item.minStock}`}
                  />
                  <Chip label="הזמן עכשיו" color="error" size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
