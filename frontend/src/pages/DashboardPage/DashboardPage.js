/* eslint-disable no-unused-vars */
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import PageContainer from '@/components/PageContainer/PageContainer';
import { increment, decrement } from '@/features/counter/counterSlice';


export default function DashboardPage() {
  const dispatch = useDispatch();
  const counter = useSelector(state => state.counter.value);

  return (
    <PageContainer pageTitle="Dashboard">
      <div>
        <h1>Counter: {counter}</h1>
        <button onClick={() => dispatch(increment())}>Increment</button>
        <button onClick={() => dispatch(decrement())}>Decrement</button>
      </div>
    </PageContainer>
  );
}
