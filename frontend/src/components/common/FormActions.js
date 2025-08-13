import {
  Box,
  Button,
  CircularProgress,
} from "@mui/material";

const FormActions = ({
  onSubmit,
  onCancel,
  submitText = `Save`,
  cancelText = `Cancel`,
  isPending = false,
  disabled = false,
  showCancel = true,
  sx = {},
}) => {
  const hasErrors = disabled || (isPending && disabled);
  const hasTwoButtons = showCancel && onCancel;

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `row`,
        gap: 2,
        mt: 2.5,
        justifyContent: `flex-start`,
        width: `100%`,
        ...sx,
      }}
    >
      {showCancel && onCancel && (
        <Button
          variant="outlined"
          color="primary"
          onClick={onCancel}
          disabled={isPending}
          sx={{
            flex: 1,
            minWidth: 120,
          }}
        >
          {cancelText}
        </Button>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        disabled={hasErrors}
        endIcon={isPending && <CircularProgress size={16} />}
        sx={{
          flex: hasTwoButtons ? 1 : `none`,
          width: hasTwoButtons ? `auto` : `100%`,
          minWidth: hasTwoButtons ? 120 : `auto`,
        }}
      >
        {submitText}
      </Button>
    </Box>
  );
};

export default FormActions;