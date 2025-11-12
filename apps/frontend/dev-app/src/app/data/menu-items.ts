// import { MenuItems } from "@fe/layout";
// import { MenuItems } from "./menu.model";

  // Use the MenuItems type here
  export const APP_MENU_ITEMS = [
    //  export const APP_MENU_ITEMS: MenuItems[] = [
  {
    icon: 'home',
    label: 'SideNavMenu.Home',
    route: 'pages/home',
  },
  {
    icon: 'supervised_user_circle', // person
    //  icon: 'face', // person
    label: 'SideNavMenu.Users',
    route: 'users',
    subItems: [
      {
        icon: 'person', // person
        label: 'SideNavMenu.UserProfile',
        route: 'userprofile',
      }
    ],
  },
  {
    icon: 'apps', // apps
    label: 'SideNavMenu.Todos',
    route: 'todos',
  },
  {
    icon: 'task',
    label: 'SideNavMenu.Tasks',
    route: 'tasks',
  },
  {
    icon: 'dashboard',
    label: 'SideNavMenu.Dashboard',
    route: 'dashboard',
  },
  {
    icon: 'format_list_bulleted',
    label: 'SideNavMenu.Components',
    route: 'components',
    subItems: [
      {
        icon: 'touch_app',
        label: 'Buttons',
        route: 'buttons',
        subItems: [
          {
            icon: 'radio_button_checked',
            label: 'ButtonTypes',
            route: 'button-types',
          },
          {
            icon: 'toggle_on',
            label: 'ButtonToggle',
            route: 'button-toggle',
          },
          ]
      },
      {
        icon: 'question_answer',
        label: 'Dialog',
        route: 'dialog',
      },
      {
        icon: 'text_fields',
        label: 'Inputs',
        route: 'inputs',
      },
      {
        icon: 'view_agenda',
        label: 'Panels',
        route: 'panels',
      },
      {
        icon: 'donut_large',
        label: 'Progress',
        route: 'progress',
      },
      {
        icon: 'format_list_numbered',
        label: 'Stepper',
        route: 'stepper',
      },
      {
        icon: 'table_chart',
        label: 'Table',
        route: 'table',
      },
      {
        icon: 'tab',
        label: 'Tabs',
        route: 'tabs',
      },
    ],
  },
  {
    icon: 'video_library',
    label: 'SideNavMenu.Content',
    route: 'content',
  },
  {
    icon: 'comment',
    label: 'SideNavMenu.Comments',
    route: 'comments',
  },
  ];


