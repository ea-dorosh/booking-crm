import {
  Box,
  Button,
  CircularProgress,
} from "@mui/material";

const FormActions = ({
  onSubmit,
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  isPending = false,
  disabled = false,
  showCancel = true,
  sx = {},
}) => {
  const hasErrors = disabled || (isPending && disabled);

  return (
    <Box
      sx={{
        display: `flex`,
        gap: 2,
        mt: 2.5,
        ...sx,
      }}
    >
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        disabled={hasErrors}
        endIcon={isPending && <CircularProgress size={16} />}
        sx={{ flexGrow: 1 }}
      >
        {submitText}
      </Button>

      {showCancel && onCancel && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          disabled={isPending}
          sx={{ flexGrow: 1 }}
        >
          {cancelText}
        </Button>
      )}
    </Box>
  );
};

export default FormActions;