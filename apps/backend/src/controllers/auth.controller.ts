import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import bcrypt from "bcrypt";
import { prisma } from "db";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authSchema } from "../types/zodSchema";
import { envConfig } from "../utils/env";
import { sendValidationError } from "../utils/validation";

export async function signup(req: Request, res: Response) {
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(parsedBody.error, res);
    return;
  }

  const { username, password } = parsedBody.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      res.status(400).json({
        error: "User already exist",
      });
      return;
    }

    const hasedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hasedPassword,
      },
    });

    res.status(201).json({
      message: "signup successfull",
      userId: newUser.id,
      username: newUser.username,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof PrismaClientKnownRequestError) {
      res.status(400).json({
        error: err,
      });
    }
    res.status(500).json({
      error: "Internal server error.",
    });
  }
}

export async function signin(req: Request, res: Response) {
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(parsedBody.error, res);
    return;
  }

  const { username, password } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      res.status(409).json({
        error: "Username donot exist",
      });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(409).json({
        error: "Invalid credentials",
      });
      return;
    }

    const token = jwt.sign({ userId: user.id }, envConfig.jwt_secret);
    res.status(200).json({
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}
