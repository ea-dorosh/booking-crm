import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  List,
} from "@mui/material";
import { useState } from "react";
import CompanyBranchForm from "@/components/CompanyBranchForm/CompanyBranchForm";
import ListItemText from "@/components/ListItemText/ListItemText";

export default function CompanyBranchDetails({
  branch,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
  onEditModeClick,
  disabledEditMode,
}) {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <Box>
      {!isEditMode &&
        <List>
          <ListItemText
            value={branch.name}
            label="Name"
          />

          <ListItemText
            value={`${branch.addressStreet}, ${branch.addressZip} ${branch.addressCity}, ${branch.addressCountry}`}
            label="Address"
          />

          <ListItemText
            value={branch.phone}
            label="Phone"
          />

          <ListItemText
            value={branch.email}
            label="Email"
          />
        </List>
      }

      {isEditMode &&
        <CompanyBranchForm
          branch={branch}
          submitForm={submitForm}
          formErrors={formErrors}
          cleanError={cleanError}
          cleanErrors={cleanErrors}
          isPending={isPending}
          onCancelClick={() => {
            cleanErrors();
            setIsEditMode(false);
          }}
        />
      }

      {!isEditMode && !disabledEditMode &&
        <Button
          startIcon={<EditIcon />}
          onClick={() => {
            cleanErrors();
            setIsEditMode(true);
            onEditModeClick();
          }}
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Change Branch Details
        </Button>
      }
    </Box>
  );
}
