import { useMutation } from "@tanstack/react-query";
import { createLink, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  StackProps,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ProfileIcon from "@mui/icons-material/Person2";
import HomeIcon from "@mui/icons-material/Home";

import Logo from "@assets/logo.svg?react";
import useUser from "@libs/userContext/useUser";
import { useEffect } from "react";
import { logout as logoutApi } from "@libs/api";

const ListItemButtonLink = createLink(ListItemButton);

type NavbarProps = Omit<StackProps, "children">;

function Navbar(props: NavbarProps) {
  const { sx, ...restProps } = props;

  const navigate = useNavigate();

  const { user, setUser } = useUser();

  const { mutate: logout } = useMutation({
    mutationFn: async (refreshToken: string) => {
      await logoutApi(refreshToken);
    },
  });

  const handleLogoutClick = async () => {
    if (user !== null) {
      await logout(user.refreshToken, {
        onSuccess: () => {
          setUser(null);
        },
      });
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  return (
    <Stack
      sx={{
        alignItems: "flex-end",
        paddingX: 2,
        ...sx,
      }}
      {...restProps}
    >
      <Toolbar>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: "center", alignItems: "center" }}
        >
          <Logo width={40} />

          <Typography>X.AI</Typography>
        </Stack>
      </Toolbar>
      <Stack
        sx={{
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <Box>
          <List>
            <ListItem disablePadding>
              <ListItemButtonLink
                to="/home"
                activeOptions={{ exact: true }}
                activeProps={{ selected: true }}
              >
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary={"Home"} />
              </ListItemButtonLink>
            </ListItem>
            <ListItem disablePadding>
              {user && (
                <ListItemButtonLink
                  to="/users/$userID"
                  params={{ userID: user._id }}
                  activeOptions={{ exact: true }}
                  activeProps={{ selected: true }}
                >
                  <ListItemIcon>
                    <ProfileIcon />
                  </ListItemIcon>
                  <ListItemText primary={"Profile"} />
                </ListItemButtonLink>
              )}
            </ListItem>
          </List>
        </Box>
        <Box>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogoutClick}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={"Logout"} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Stack>
    </Stack>
  );
}

export default Navbar;
