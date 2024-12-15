import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

export interface DbPoolType extends mysql.Pool {

}

export interface CustomRequestType extends Request {
  dbPool?: DbPoolType;
}

export interface CustomResponseType extends Response {

}