import { createTheme } from '@mui/material/styles';

// Modern CRM Color Palette
const colors = {
  primary: {
    50: `#fdf2f8`,
    100: `#fce7f3`,
    200: `#fbcfe8`,
    300: `#f9a8d4`,
    400: `#f472b6`,
    500: `#e11d48`, // Main primary
    600: `#be185d`,
    700: `#9f1239`,
    800: `#881337`,
    900: `#4c0519`,
  },
  secondary: {
    50: `#f3e5f5`,
    100: `#e1bee7`,
    200: `#ce93d8`,
    300: `#ba68c8`,
    400: `#ab47bc`,
    500: `#9c27b0`, // Main secondary
    600: `#8e24aa`,
    700: `#7b1fa2`,
    800: `#6a1b9a`,
    900: `#4a148c`,
  },
  success: {
    50: `#e8f5e8`,
    100: `#c8e6c9`,
    200: `#a5d6a7`,
    300: `#81c784`,
    400: `#66bb6a`,
    500: `#4caf50`, // Main success
    600: `#43a047`,
    700: `#388e3c`,
    800: `#2e7d32`,
    900: `#1b5e20`,
  },
  warning: {
    50: `#fff3e0`,
    100: `#ffe0b2`,
    200: `#ffcc80`,
    300: `#ffb74d`,
    400: `#ffa726`,
    500: `#ff9800`, // Main warning
    600: `#fb8c00`,
    700: `#f57c00`,
    800: `#ef6c00`,
    900: `#e65100`,
  },
  error: {
    50: `#ffebee`,
    100: `#ffcdd2`,
    200: `#ef9a9a`,
    300: `#e57373`,
    400: `#ef5350`,
    500: `#f44336`, // Main error
    600: `#e53935`,
    700: `#d32f2f`,
    800: `#c62828`,
    900: `#b71c1c`,
  },
  neutral: {
    50: `#fafafa`,
    100: `#f5f5f5`,
    200: `#eeeeee`,
    300: `#e0e0e0`,
    400: `#bdbdbd`,
    500: `#9e9e9e`,
    600: `#757575`,
    700: `#616161`,
    800: `#424242`,
    900: `#212121`,
  },
};

const theme = createTheme({
  palette: {
    mode: `light`,
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: `#ffffff`,
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: `#ffffff`,
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700],
      contrastText: `#ffffff`,
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
      contrastText: `#ffffff`,
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700],
      contrastText: `#ffffff`,
    },
    grey: colors.neutral,
    background: {
      default: `#f8fafc`,
      paper: `#ffffff`,
    },
    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[600],
      disabled: colors.neutral[400],
    },
    divider: colors.neutral[200],
  },
  typography: {
    fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
    h1: {
      fontWeight: 700,
      fontSize: `2.5rem`,
      lineHeight: 1.2,
      letterSpacing: `-0.01562em`,
    },
    h2: {
      fontWeight: 700,
      fontSize: `2rem`,
      lineHeight: 1.2,
      letterSpacing: `-0.00833em`,
    },
    h3: {
      fontWeight: 600,
      fontSize: `1.75rem`,
      lineHeight: 1.2,
      letterSpacing: `0em`,
    },
    h4: {
      fontWeight: 600,
      fontSize: `1.5rem`,
      lineHeight: 1.2,
      letterSpacing: `0.00735em`,
    },
    h5: {
      fontWeight: 600,
      fontSize: `1.25rem`,
      lineHeight: 1.2,
      letterSpacing: `0em`,
    },
    h6: {
      fontWeight: 600,
      fontSize: `1.125rem`,
      lineHeight: 1.2,
      letterSpacing: `0.0075em`,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: `1rem`,
      lineHeight: 1.5,
      letterSpacing: `0.00938em`,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: `0.875rem`,
      lineHeight: 1.57,
      letterSpacing: `0.00714em`,
    },
    body1: {
      fontWeight: 400,
      fontSize: `1rem`,
      lineHeight: 1.5,
      letterSpacing: `0.00938em`,
    },
    body2: {
      fontWeight: 400,
      fontSize: `0.875rem`,
      lineHeight: 1.43,
      letterSpacing: `0.01071em`,
    },
    button: {
      fontWeight: 500,
      fontSize: `0.875rem`,
      lineHeight: 1.75,
      letterSpacing: `0.02857em`,
      textTransform: `none`,
    },
    caption: {
      fontWeight: 400,
      fontSize: `0.75rem`,
      lineHeight: 1.66,
      letterSpacing: `0.03333em`,
    },
    overline: {
      fontWeight: 400,
      fontSize: `0.75rem`,
      lineHeight: 2.66,
      letterSpacing: `0.08333em`,
      textTransform: `uppercase`,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    `none`,
    `0px 1px 3px 0px rgba(0,0,0,0.12)`,
    `0px 1px 5px 0px rgba(0,0,0,0.12)`,
    `0px 3px 5px -1px rgba(0,0,0,0.12)`,
    `0px 2px 4px -1px rgba(0,0,0,0.12)`,
    `0px 3px 5px -1px rgba(0,0,0,0.12)`,
    `0px 3px 5px -1px rgba(0,0,0,0.12)`,
    `0px 4px 5px -2px rgba(0,0,0,0.12)`,
    `0px 5px 5px -3px rgba(0,0,0,0.12)`,
    `0px 5px 6px -3px rgba(0,0,0,0.12)`,
    `0px 6px 6px -3px rgba(0,0,0,0.12)`,
    `0px 6px 7px -4px rgba(0,0,0,0.12)`,
    `0px 7px 8px -4px rgba(0,0,0,0.12)`,
    `0px 7px 8px -4px rgba(0,0,0,0.12)`,
    `0px 7px 9px -4px rgba(0,0,0,0.12)`,
    `0px 8px 9px -5px rgba(0,0,0,0.12)`,
    `0px 8px 10px -5px rgba(0,0,0,0.12)`,
    `0px 8px 11px -5px rgba(0,0,0,0.12)`,
    `0px 9px 11px -5px rgba(0,0,0,0.12)`,
    `0px 9px 12px -6px rgba(0,0,0,0.12)`,
    `0px 10px 13px -6px rgba(0,0,0,0.12)`,
    `0px 10px 13px -6px rgba(0,0,0,0.12)`,
    `0px 10px 14px -6px rgba(0,0,0,0.12)`,
    `0px 11px 14px -7px rgba(0,0,0,0.12)`,
    `0px 11px 15px -7px rgba(0,0,0,0.12)`,
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: `none`,
          fontWeight: 500,
          padding: `10px 24px`,
          boxShadow: `none`,
        },
        contained: {
          // Removed hover styles
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: `0px 2px 8px 0px rgba(0,0,0,0.08)`,
          border: `1px solid ${colors.neutral[100]}`,
          // Removed hover styles
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: `20px 24px`,
        },
        title: {
          fontWeight: 600,
          fontSize: `1.125rem`,
          color: colors.neutral[800],
        },
        subheader: {
          fontSize: `0.875rem`,
          color: colors.neutral[600],
          marginTop: `4px`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: `0px 2px 8px 0px rgba(0,0,0,0.08)`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          // Removed hover styles
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: `0px 2px 8px 0px rgba(0,0,0,0.15)`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            // Removed hover styles
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
      variants: [
        {
          props: {
            color: `success`,
            variant: `filled`,
          },
          style: {
            backgroundColor: colors.success[500],
            color: `#ffffff`,
            '& .MuiChip-label': {
              fontWeight: 600,
            },
          },
        },
        {
          props: {
            color: `info`,
            variant: `filled`,
          },
          style: {
            backgroundColor: colors.neutral[400],
            color: `#ffffff`,
            '& .MuiChip-label': {
              fontWeight: 600,
            },
          },
        },
        {
          props: {
            color: `error`,
            variant: `filled`,
          },
          style: {
            backgroundColor: colors.error[500],
            color: `#ffffff`,
            '& .MuiChip-label': {
              fontWeight: 600,
            },
          },
        },
      ],
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: `0px 1px 4px 0px rgba(0,0,0,0.08)`,
          borderBottom: `1px solid ${colors.neutral[100]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          borderRight: `0px solid ${colors.neutral[100]}`,
          boxShadow: `4px 0px 8px 0px rgba(0,0,0,0.08)`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: `4px 0`,
          paddingLeft: `14px`,
          paddingRight: `14px`,
          minHeight: 48,
          // Removed hover styles
          '&.Mui-selected': {
            backgroundColor: colors.primary[100],
            color: colors.primary[700],
            // Removed hover styles
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: colors.neutral[600],
          '& .MuiSvgIcon-root': {
            fontSize: `1.25rem`,
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          margin: 0,
        },
        primary: {
          fontSize: `0.875rem`,
          fontWeight: 500,
          color: colors.neutral[700],
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: `transparent`,
          gap: 0, // seamless segmented control
        },
        grouped: {
          margin: 0,
          border: `1px solid ${colors.neutral[200]}`,
          borderRadius: 0,
          '&:not(:first-of-type)': {
            borderLeft: `1px solid ${colors.neutral[200]}`,
            marginLeft: -1, // collapse inner borders into 1px divider
          },
          '&:first-of-type': {
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          },
          '&:last-of-type': {
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: `none`,
          borderRadius: 0,
          fontWeight: 600,
          color: colors.neutral[600],
          backgroundColor: `#ffffff`,
          padding: `6px 12px`,
          borderColor: colors.neutral[200],
          '&:hover': {
            backgroundColor: colors.primary[50],
            borderColor: colors.primary[200],
          },
          '&.Mui-selected': {
            color: colors.primary[700],
            backgroundColor: colors.primary[50],
            borderColor: colors.primary[300],
          },
          '&.Mui-selected:hover': {
            backgroundColor: colors.primary[100],
            borderColor: colors.primary[300],
          },
        },
        sizeSmall: {
          padding: `4px 10px`,
          fontSize: `0.85rem`,
        },
      },
    },
  },
});

export default theme;