import express from "express";
import { envConfig } from "./env";
import { authSchema } from "./types";
import { prisma } from "db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Username or password error",
    });
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

    res.status(200).json({
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
});

app.post("/signin", async (req, res) => {
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Username or password error",
    });
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
});

app.listen(envConfig.port, () =>
  console.log(`Backend started on port ${envConfig.port}`)
);

app.post("/order", (req, res) => {});
