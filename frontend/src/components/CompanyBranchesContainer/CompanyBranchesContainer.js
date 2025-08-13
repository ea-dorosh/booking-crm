import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  Box,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import CompanyBranchDetails from "@/components/CompanyBranchDetails/CompanyBranchDetails";
import CompanyBranchForm from "@/components/CompanyBranchForm/CompanyBranchForm";
import {
  updateCompanyBranch,
  cleanError,
  cleanErrors,
} from "@/features/company/companyBranchSlice";
import { fetchCompany } from "@/features/company/companySlice";

export default function CompanyBranchesContainer({ branches }) {
  const dispatch = useDispatch();
  const {
    updateFormPending, updateFormErrors,
  } = useSelector(state => state.companyBranch);

  const [isAddMode, setIsAddMode] = useState(false);
  const [hasAddButton, setHasAddButton] = useState(true);

  const submitForm = async (branch) => {
    try {
      await dispatch(updateCompanyBranch(branch)).unwrap();

      dispatch(cleanErrors());
      setIsAddMode(false);
      setHasAddButton(true);

      dispatch(fetchCompany());
    } catch (error) {
      console.error(error);
    }
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  return (
    <Box
      mt={3}
    >
      {hasAddButton &&
        <Box>
          <Button
            onClick={() => {
              dispatch(cleanErrors());
              setIsAddMode(true);
            }}
            disabled={isAddMode}
          >
            <AddIcon />
            Add Branch
          </Button>

        </Box>
      }

      {isAddMode &&
        <CompanyBranchForm
          submitForm={submitForm}
          formErrors={updateFormErrors?.validationErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
          isPending={updateFormPending}
          onCancelClick={() => {
            dispatch(cleanErrors());
            setIsAddMode(false);
          }}
        />
      }

      {branches.map((branch) => (
        <CompanyBranchDetails
          key={branch.id}
          branch={branch}
          submitForm={submitForm}
          formErrors={updateFormErrors?.validationErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
          isPending={updateFormPending}
          onEditModeClick={() => setHasAddButton(false)}
          disabledEditMode={isAddMode}
        />
      ))}
    </Box>
  );
}
