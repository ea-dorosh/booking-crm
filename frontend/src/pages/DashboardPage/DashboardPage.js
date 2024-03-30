/* eslint-disable no-unused-vars */
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import { increment, decrement } from '@/features/counter/counterSlice';


export default function DashboardPage() {
  const dispatch = useDispatch();
  const counter = useSelector(state => state.counter.value);

  return (
    <main>
      <Box sx={{ width: "100%", maxWidth: 768 }}>
        <Typography variant="h2">Dashboard</Typography>

        <Divider />

        <Link to={`employees`}>Employees</Link>

        <Divider />

        <Link to={`services`}>Services</Link>
      </Box>

      <div>
        <h1>Counter: {counter}</h1>
        <button onClick={() => dispatch(increment())}>Increment</button>
        <button onClick={() => dispatch(decrement())}>Decrement</button>
      </div>
    </main>
  );
}
