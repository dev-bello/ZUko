export const sidebarLinks = [
  {
    imgURL: "/assets/home.svg",
    route: "/",
    label: "Home",
  },

  {
    imgURL: "/assets/user.svg",
    route: "/profile",
    label: "Profile",
  },

  {
    imgURL: "/assets/notif.svg",
    route: "/activity",
    label: "Notifications",
  },
  {
    imgURL: "/assets/search.svg",
    route: "/search",
    label: "Search",
  },
  {
    imgURL: "/assets/create.svg",
    route: "/create-post",
    label: "Create Post",
  },
  {
    imgURL: "/assets/community.svg",
    route: "/communities",
    label: "Communities",
  },
];

export const profileTabs = [
  { value: "post", label: "Posts", icon: "/assets/reply.svg" },
];

export const communityTabs = [
  { value: "post", label: "Post", icon: "/assets/reply.svg" },
  { value: "members", label: "Members", icon: "/assets/members.svg" },
  { value: "requests", label: "Requests", icon: "/assets/request.svg" },
];
