"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import authStore from "@/state/authStore";
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider,
  Badge,
  InputBase,
  alpha,
  Avatar,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Inventory2 as Inventory2Icon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 72;

/**
 * UX goals implemented:
 * - Desktop: permanent rail (collapsed width) that NEVER shifts layout. On hover, an overlay panel expands on top (no layout jump).
 * - Mobile: temporary drawer as usual.
 * - AppBar and content widths are calculated once against the collapsed rail width only.
 * - No horizontal scroll; main area keeps content inside the viewport width.
 * - Subtle top bar elements (search, notifications, user avatar, small chip) for a more engaging but still clear UI.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hoverExpanded, setHoverExpanded] = React.useState(false);
  const hoverTimer = React.useRef<number | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = React.useState<{ username: string; loginTime: number } | null>(null);

  const openOverlay = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHoverExpanded(true);
  };

  const scheduleCloseOverlay = (delay = 120) => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
    }
    hoverTimer.current = window.setTimeout(() => {
      setHoverExpanded(false);
      hoverTimer.current = null;
    }, delay) as unknown as number;
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const pathname = usePathname();

  // Auth protection - redirect to login if not authenticated
  React.useEffect(() => {
    if (!authStore.isLoggedIn()) {
      router.push("/login");
      return;
    }
    setAuthChecked(true);
    setCurrentUser(authStore.getUser());
  }, [router]);

  // Don't render the protected content until auth is verified
  if (!authChecked) {
    return null;
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    authStore.logout();
    handleUserMenuClose();
    router.push("/login");
  };

  const handleSettings = () => {
    handleUserMenuClose();
    router.push("/settings");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "דשבורד", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "לקוחות", icon: <PeopleIcon />, path: "/customers" },
    { text: "פריטים", icon: <InventoryIcon />, path: "/items" },
    { text: "מחסנים", icon: <Inventory2Icon />, path: "/storages" },
    { text: "מסמכים", icon: <DescriptionIcon />, path: "/documents" },
    { text: "הזמנות", icon: <DescriptionIcon />, path: "/orders" },
    { text: "קבלות", icon: <ReceiptIcon />, path: "/receipts" },
    { text: "הגדרות", icon: <SettingsIcon />, path: "/settings" },
  ];

  // Base layout width always reserves the collapsed rail on desktop, expanded on mobile
  const baseRailWidth = isMobile ? drawerWidthExpanded : drawerWidthCollapsed;

  // Drawer list content (expanded flag controls label visibility)
  const DrawerList = ({ expanded }: { expanded: boolean }) => (
    <List sx={{ py: 1, flex: 1 }}>
      {menuItems.map((item) => {
        const selected = pathname === item.path;
        const button = (
          <ListItemButton
            selected={selected}
            onClick={() => {
              router.push(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": {
                  color: "primary.contrastText",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: expanded ? 2 : "auto",
                justifyContent: "center",
                color: selected ? "inherit" : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                display: { xs: "none", md: expanded ? "block" : "none" },
              }}
            />
          </ListItemButton>
        );

        return (
          <ListItem key={item.path} disablePadding sx={{ display: "block" }}>
            {expanded ? (
              button
            ) : (
              <Tooltip title={item.text} placement="left">
                <Box>{button}</Box>
              </Tooltip>
            )}
          </ListItem>
        );
      })}
    </List>
  );

  const DrawerHeader = ({ expanded }: { expanded: boolean }) => (
    <Toolbar sx={{ minHeight: 64, px: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "primary.contrastText",
            flexShrink: 0,
            boxShadow: 1,
          }}
        >
          <InventoryIcon fontSize="small" />
        </Box>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            display: { xs: "none", md: expanded ? "block" : "none" },
          }}
        >
          מערכת ניהול מלאי
        </Typography>
      </Box>
    </Toolbar>
  );

  const RailContent = (expanded: boolean) => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <DrawerHeader expanded={expanded} />
      <Divider />
      <DrawerList expanded={expanded} />
      <Box sx={{ p: expanded ? 2 : 1, display: { xs: "none", md: "block" } }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: expanded ? "block" : "none" }}
        >
          © {new Date().getFullYear()} Rivhit Inventory
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflowX: "hidden", flexDirection: { md: "row-reverse" } }}>
      {/* Top bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${baseRailWidth}px)` },
          mr: { md: `${baseRailWidth}px` },
          backdropFilter: "saturate(180%) blur(6px)",
          boxShadow: "none",
        }}
      >
        <Toolbar sx={{ minHeight: 64, gap: 2, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              מערכת ניהול מלאי והזמנות
            </Typography>
          </Box>

          {/* AppBar actions: subtle search, notification, profile */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 2,
                bgcolor: alpha("#ffffff", 0.15),
                "&:hover": { bgcolor: alpha("#ffffff", 0.25) },
                display: { xs: "none", sm: "block" },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                  px: 1.5,
                }}
              >
                <SearchIcon sx={{ color: "inherit", opacity: 0.9 }} />
              </Box>
              <InputBase
                placeholder="חיפוש מהיר…"
                inputProps={{ "aria-label": "search" }}
                sx={{
                  color: "inherit",
                  pl: 5,
                  pr: 2,
                  py: 0.5,
                  width: 240,
                }}
              />
            </Box>

            <Chip
              size="small"
              color="secondary"
              variant="filled"
              label="Mock Mode"
              sx={{ display: process.env.NODE_ENV === "development" ? "inline-flex" : "none" }}
            />

            <IconButton color="inherit" aria-label="notifications">
              <Badge color="secondary" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            {/* User menu */}
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ p: 0 }}
              aria-label="user menu"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                {currentUser?.username.charAt(0).toUpperCase() || "א"}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                {currentUser?.username || "משתמש"}
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                הגדרות
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                יציאה
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation rail area */}
      <Box
        component="nav"
        sx={{
          width: { md: baseRailWidth },
          flexShrink: { md: 0 },
        }}
        aria-label="navigation menu"
      >
        {/* Mobile temporary drawer */}
        <Drawer
          anchor="right"
          variant="temporary"
          open={isMobile ? mobileOpen : false}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidthExpanded,
              background: "linear-gradient(180deg, #ffffff 0%, #f7faff 100%)",
            },
          }}
        >
          {RailContent(true)}
        </Drawer>

        {/* Desktop: permanent rail inside layout flow (does not overlay content) */}
        <Drawer
          anchor="right"
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: baseRailWidth,
              background: "linear-gradient(180deg, #ffffff 0%, #f7faff 100%)",
              borderLeft: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              position: "relative",
              zIndex: 0, // keep below overlay drawer
            },
          }}
          onMouseEnter={openOverlay}
          onMouseLeave={() => scheduleCloseOverlay()}
        >
          {RailContent(false)}
        </Drawer>

        {/* Desktop: overlay drawer on hover (does NOT affect layout width) */}
        <Drawer
          anchor="right"
          variant="temporary"
          hideBackdrop
          open={!isMobile && hoverExpanded}
          onClose={() => setHoverExpanded(false)}
          sx={{
            display: { xs: "none", md: "block" },
            pointerEvents: "none", // container doesn't capture clicks except paper
            "& .MuiDrawer-paper": {
              pointerEvents: "auto",
              boxSizing: "border-box",
              width: drawerWidthExpanded,
              background: "linear-gradient(180deg, #ffffff 0%, #f7faff 100%)",
              borderLeft: "1px solid",
              borderColor: "divider",
            },
          }}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            onMouseEnter: openOverlay,
            onMouseLeave: () => scheduleCloseOverlay(),
          }}
        >
          {/* Keep it expanded UI */}
          {RailContent(true)}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${baseRailWidth}px)` },
          mt: "64px",
          minHeight: "calc(100vh - 64px)",
          bgcolor: "background.default",
          overflowX: "hidden",
          overflowY: "auto",
          p: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
