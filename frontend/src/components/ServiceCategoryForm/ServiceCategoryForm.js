/* eslint-disable no-unused-vars */
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";

export default function ServiceCategoryForm({
  category,
  createNewCategory,
  formErrors,
  cleanError,
  cleanErrors,
}) {
  const isEditMode = Boolean(category);
  console.log('category', category);
  const [formData, setFormData] = useState({
    name: isEditMode ? category.name : ``,
    id: isEditMode ? category.id : ``,
    img: isEditMode ? category.img : null,
  });

  useEffect(() => {
    return () => cleanErrors()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if(formErrors && formErrors[name]) {
      cleanError(name);
    }
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImgChange = (event) => {
    setFormData((prevData) => ({
      ...prevData,
      img: event.target.files[0],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await createNewCategory({
      ...category,
      ...formData,
    });
  };
  console.log(`formData`, formData);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FormControl error={Boolean(formErrors?.name)}>
        <TextField
          value={formData.name}
          label="Service Category Name"
          variant="outlined"
          name="name"
          onChange={handleChange}
        />
        {formErrors?.name && 
          <FormHelperText>
            {formErrors.name}
          </FormHelperText>
        }
      </FormControl>

      <Button
        variant="contained"
        component="label"
      >
        Upload File
        <input
          type="file"
          hidden
          onChange={handleImgChange}
        />
      </Button>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: `20px` }}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      >
        Save
      </Button>
    </Box>
  );
}
