import {
  AddCircle,
} from "@mui/icons-material";
import {
  IconButton,
  List,
  Typography,
  Box,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import ListItemText from '@/components/ListItemText/ListItemText';

export default function ServiceCategoriesContainer({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <Box sx={{
        p: 2, textAlign: `center`, 
      }}>
        <Typography variant="body1" color="text.secondary">
          No categories found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {categories.map((category) => (
        <Box
          key={category.id}
          sx={{
            display: `flex`,
            alignItems: `center`,
            justifyContent: `space-between`,
            p: 1,
            borderBottom: `1px solid #e0e0e0`,
          }}
        >
          <RouterLink
            to={`/categories/${category.id}`}
            style={{
              textDecoration: `none`, color: `inherit`, flex: 1, 
            }}
          >
            <ListItemText
              primary={category.name}
              secondary={category.status}
              image={category.image}
            />
          </RouterLink>
          <IconButton
            component={RouterLink}
            to={`/categories/${category.id}`}
            size="small"
          >
            <AddCircle />
          </IconButton>
        </Box>
      ))}
    </List>
  );
}
