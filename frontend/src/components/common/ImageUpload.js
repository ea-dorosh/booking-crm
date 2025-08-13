import { CloudUpload, PhotoCamera, Delete } from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
} from "@mui/material";
import { useState } from "react";

const ImageUpload = ({
  name,
  onChange,
  currentImage,
  disabled = false,
  sx = {},
}) => {
  const [temporaryImage, setTemporaryImage] = useState(null);

  const handleImgChange = (event) => {
    const [file] = event.target.files;
    if (file) {
      setTemporaryImage(URL.createObjectURL(file));
    }

    onChange(event);
  };

  const handleRemoveImage = () => {
    setTemporaryImage(null);
    // Create fake event to clear the image
    onChange({
      target: {
        files: [],
        name, 
      }, 
    });
  };

  const displayImage = temporaryImage || currentImage;

  return (
    <Box
      sx={{
        width: `100%`,
        ...sx, 
      }}
    >
      <Box
        sx={{
          display: `flex`,
          flexDirection: `column`,
          alignItems: `center`,
          gap: 2,
        }}
      >
        {/* Image Preview */}
        {displayImage ? (
          <Box
            sx={{
              position: `relative`,
              display: `flex`,
              flexDirection: `column`,
              alignItems: `center`,
              gap: 1,
            }}
          >
            <Avatar
              src={displayImage}
              sx={{
                width: 120,
                height: 120,
                border: `3px solid`,
                borderColor: `primary.light`,
                boxShadow: 2,
              }}
            />

            <Box
              sx={{
                display: `flex`,
                gap: 1, 
              }}
            >
              {/* Change Image Button */}
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<PhotoCamera />}
                disabled={disabled}
                sx={{
                  borderRadius: 2,
                  textTransform: `none`,
                  fontSize: `0.875rem`,
                }}
              >
                Change
                <input
                  type="file"
                  name={name}
                  onChange={handleImgChange}
                  accept="image/*"
                  hidden
                  disabled={disabled}
                />
              </Button>

              {/* Remove Image Button */}
              <IconButton
                onClick={handleRemoveImage}
                disabled={disabled}
                size="small"
                sx={{
                  color: `error.main`,
                  '&:hover': {
                    backgroundColor: `error.light`,
                    color: `white`,
                  },
                }}
              >
                <Delete
                  fontSize="small"
                />
              </IconButton>
            </Box>
          </Box>
        ) : (
          /* Upload Button */
          <Box
            sx={{
              display: `flex`,
              flexDirection: `column`,
              alignItems: `center`,
              gap: 1,
              py: 4,
              px: 3,
              border: `2px dashed`,
              borderColor: `divider`,
              borderRadius: 2,
              backgroundColor: `grey.50`,
              minWidth: 200,
              '&:hover': {
                borderColor: `primary.main`,
                backgroundColor: `primary.50`,
              },
            }}
          >
            <CloudUpload
              sx={{
                fontSize: 48,
                color: `text.secondary`, 
              }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Upload profile image
            </Typography>

            <Button
              component="label"
              variant="contained"
              startIcon={<PhotoCamera />}
              disabled={disabled}
              sx={{
                borderRadius: 2,
                textTransform: `none`,
                mt: 1,
              }}
            >
              Choose File
              <input
                type="file"
                name={name}
                onChange={handleImgChange}
                accept="image/*"
                hidden
                disabled={disabled}
              />
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageUpload;